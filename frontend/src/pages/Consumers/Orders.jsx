import React, { useState } from "react";
import { FiSearch, FiEye, FiDownload, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Orders = () => {
  const [orders] = useState([
    {
      id: "ORD67890",
      date: "2025-03-18",
      farmer: "Green Acres Farm",
      items: 5,
      total: 87.50,
      status: "Delivered"
    },
    {
      id: "ORD67891",
      date: "2025-03-20",
      farmer: "Sunset Valley Organics",
      items: 3,
      total: 45.25,
      status: "Processing"
    },
    {
      id: "ORD67892",
      date: "2025-03-19",
      farmer: "Heritage Family Farms",
      items: 8,
      total: 110.75,
      status: "Shipped"
    },
    {
      id: "ORD67893",
      date: "2025-03-15",
      farmer: "Riverdale Farms",
      items: 2,
      total: 28.99,
      status: "Delivered"
    }
  ]);
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;
  
  // Filter orders based on status and search term
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" || order.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.farmer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="min-h-screen bg-[#0A2725] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto bg-[#0A2725] rounded-2xl shadow-2xl overflow-hidden border border-[#0EA5E9]/20">
        <div className="p-6 border-b border-[#0EA5E9]/20">
          <h2 className="text-2xl font-bold text-white mb-6">Your Orders</h2>
          
          {/* Search and filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-[#0EA5E9]" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-[#0A2725] border border-[#0EA5E9]/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-lg border border-[#0EA5E9]/20 ${
                  filterStatus === "all" 
                    ? "bg-[#0EA5E9] text-white" 
                    : "bg-[#0A2725] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                }`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterStatus("processing")}
                className={`px-4 py-2 rounded-lg border border-[#0EA5E9]/20 ${
                  filterStatus === "processing" 
                    ? "bg-[#0EA5E9] text-white" 
                    : "bg-[#0A2725] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                }`}
              >
                Processing
              </button>
              <button 
                onClick={() => setFilterStatus("shipped")}
                className={`px-4 py-2 rounded-lg border border-[#0EA5E9]/20 ${
                  filterStatus === "shipped" 
                    ? "bg-[#0EA5E9] text-white" 
                    : "bg-[#0A2725] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                }`}
              >
                Shipped
              </button>
              <button 
                onClick={() => setFilterStatus("delivered")}
                className={`px-4 py-2 rounded-lg border border-[#0EA5E9]/20 ${
                  filterStatus === "delivered" 
                    ? "bg-[#0EA5E9] text-white" 
                    : "bg-[#0A2725] text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                }`}
              >
                Delivered
              </button>
            </div>
          </div>
          
          {/* Orders table */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#0A2725] border-b border-[#0EA5E9]/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                    Farmer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[#0EA5E9] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0EA5E9]/20">
                {currentOrders.length > 0 ? (
                  currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#0EA5E9]/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0EA5E9]">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {order.farmer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {order.items}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "Delivered"
                            ? "bg-[#0EA5E9]/10 text-[#0EA5E9]"
                            : order.status === "Processing"
                            ? "bg-blue-400/10 text-blue-400"
                            : "bg-yellow-400/10 text-yellow-400"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-[#0EA5E9] hover:text-[#0EA5E9]/80 mr-3">
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button className="text-[#0EA5E9] hover:text-[#0EA5E9]/80">
                          <FiDownload className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-white/60">
                      No orders found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between px-4 py-6 border-t border-[#0EA5E9]/20">
              <div className="flex items-center text-sm text-white/60">
                Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border border-[#0EA5E9]/20 ${
                    currentPage === 1
                      ? "text-white/20 cursor-not-allowed"
                      : "text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                  }`}
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => paginate(idx + 1)}
                    className={`px-4 py-2 rounded-lg border border-[#0EA5E9]/20 ${
                      currentPage === idx + 1
                        ? "bg-[#0EA5E9] text-white"
                        : "text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border border-[#0EA5E9]/20 ${
                    currentPage === totalPages
                      ? "text-white/20 cursor-not-allowed"
                      : "text-[#0EA5E9] hover:bg-[#0EA5E9]/10"
                  }`}
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;