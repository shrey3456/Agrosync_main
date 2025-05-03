import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Loader, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function PricePredictionTester() {
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState('');
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loadingCommodities, setLoadingCommodities] = useState(true);

  const location = useLocation();
  

  // Fetch available commodities on component mount
  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        setLoadingCommodities(true);
        const response = await axios.get('http://localhost:5000/api/commodities');
        if (response.data.commodities) {
          setCommodities(response.data.commodities);
        }
      } catch (err) {
        console.error('Error fetching commodities:', err);
        setError('Failed to load commodities');
      } finally {
        setLoadingCommodities(false);
      }
    };

    fetchCommodities();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCommodity) {
      setError('Please select a commodity');
      return;
    }
    
    setLoading(true);
    setError(null);
    setPrediction(null);
    
    try {
      const response = await axios.get(`http://localhost:5000/api/predict/${selectedCommodity}?days=${days}`);
      
      if (response.data.success) {
        setPrediction(response.data.predictions);
      } else {
        throw new Error(response.data.message || 'Failed to get prediction');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching prediction');
    } finally {
      setLoading(false);
    }
  };

  // Count buy signals if prediction exists
  const getBuySignalCount = () => {
    if (!prediction || !prediction.forecast) return 0;
    return prediction.forecast.filter(day => day.buy_signal).length;
  };

  // Determine if it's generally a good time to buy
  const shouldBuy = prediction && prediction.forecast && 
    getBuySignalCount() > prediction.forecast.length / 2;

  return (
    <div className="bg-[#1a332e] min-h-screen pb-16">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/consumer')} 
            className="flex items-center text-teal-400 hover:text-teal-300 transition-colors"
          >
            <ArrowLeft size={20} className="mr-1" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Price Prediction Tool
          </h1>
          <p className="text-gray-400">
            Get real-time price forecasts for agricultural commodities
          </p>
        </div>
        
        <div className="bg-[#2d4f47] rounded-xl border border-teal-500/20 overflow-hidden shadow-lg">
          <div className="p-6 border-b border-teal-500/20">
            <h2 className="text-xl font-medium text-white">Generate a Price Forecast</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="commodity" className="block text-sm font-medium text-gray-300 mb-2">
                  Select Commodity
                </label>
                {loadingCommodities ? (
                  <div className="animate-pulse h-12 bg-[#1a332e] rounded"></div>
                ) : (
                  <select
                    id="commodity"
                    value={selectedCommodity}
                    onChange={(e) => setSelectedCommodity(e.target.value)}
                    className="mt-1 block w-full py-3 px-4 bg-[#243c37] text-white border border-teal-500/30 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    required
                  >
                    <option value="">-- Select a commodity --</option>
                    {commodities.map(commodity => (
                      <option key={commodity} value={commodity}>
                        {commodity}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div>
                <label htmlFor="days" className="block text-sm font-medium text-gray-300 mb-2">
                  Days to Forecast
                </label>
                <select
                  id="days"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="mt-1 block w-full py-3 px-4 bg-[#243c37] text-white border border-teal-500/30 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                  <option value={10}>10 days</option>
                  <option value={15}>15 days</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading || loadingCommodities || !selectedCommodity}
              className={`w-full mt-6 py-3 px-4 rounded-lg shadow-sm text-base font-medium text-white ${
                loading || loadingCommodities || !selectedCommodity
                  ? 'bg-teal-800/50 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-600 transition-colors'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin w-5 h-5 mr-2" />
                  Generating forecast...
                </span>
              ) : 'Generate Price Forecast'}
            </button>
          </form>
          
          {error && (
            <div className="mx-6 mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          )}
          
          {prediction && !loading && (
            <div className="px-6 pb-6">
              <div className="border border-teal-500/20 rounded-lg overflow-hidden">
                <div className="px-5 py-4 bg-[#243c37] border-b border-teal-500/20 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Price Forecast Results</h3>
                  
                  <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                    shouldBuy 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {shouldBuy 
                      ? '✅ Good time to buy' 
                      : '⏱️ Wait for better price'}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-teal-500/20">
                    <thead className="bg-[#243c37]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Range
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Recommendation
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-500/20">
                      {prediction.forecast.map((day, index) => (
                        <tr key={index} className={day.buy_signal ? 'bg-green-500/10' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            ₹{day.price.toFixed(2)}
                            {index > 0 && (
                              <span className={`ml-2 ${
                                day.price > prediction.forecast[index-1].price
                                  ? 'text-red-400'
                                  : day.price < prediction.forecast[index-1].price
                                    ? 'text-green-400'
                                    : 'text-gray-400'
                              }`}>
                                {day.price > prediction.forecast[index-1].price && (
                                  <TrendingUp className="inline h-4 w-4" />
                                )}
                                {day.price < prediction.forecast[index-1].price && (
                                  <TrendingDown className="inline h-4 w-4" />
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            ₹{day.lower_ci.toFixed(2)} - ₹{day.upper_ci.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {day.buy_signal ? (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-400">
                                Good time to buy
                              </span>
                            ) : (
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-500/20 text-gray-300">
                                Wait for better price
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="p-5 bg-[#243c37] border-t border-teal-500/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Historical Average:</span>
                      <span className="ml-2 text-white">₹{prediction.historical_avg.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Model Type:</span>
                      <span className="ml-2 text-white">{prediction.model_type || 'SARIMA'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Generated:</span>
                      <span className="ml-2 text-white">
                        {prediction.generated_at 
                          ? new Date(prediction.generated_at).toLocaleString() 
                          : new Date().toLocaleString()
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-[#243c37] p-5 rounded-lg border border-teal-500/20 text-sm text-gray-300">
                <h4 className="text-white text-base font-medium mb-2">Understanding the Forecast</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>The forecast uses historical data to predict future prices.</li>
                  <li>The <span className="text-white">price range</span> shows the confidence interval (possible variation).</li>
                  <li>A <span className="text-green-400">buy signal</span> is generated when the predicted price is below historical average.</li>
                  <li>These predictions are best used as one of multiple factors in your purchasing decisions.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PricePredictionTester;