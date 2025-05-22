/* eslint-disable no-restricted-globals */
import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type PaymentMethod = 'Cash' | 'Postpaid';
type OrderType = string; // Changed to string for free text input
type ExpenseType = 'Diesel' | 'Maintenance' | 'Spare Parts' | 'Salary' | 'Other';

interface Order {
  id: string;
  date: string;
  vehicle: string;
  clientName: string;
  orderType: OrderType;
  location: string;
  cost: number;
  price: number;
  paymentMethod: PaymentMethod;
  paid: boolean;
}

interface Expense {
  id: string;
  date: string;
  plateNumber: string;
  type: ExpenseType;
  cost: number;
  description: string;
}

interface Client {
  id: string;
  name: string;
}

const predefinedClients: Client[] = [
  { id: '1', name: 'Hassan Bobo' },
  { id: '2', name: 'Omar Shareif' },
  { id: '3', name: 'Muhi Aldein' },
  { id: '4', name: 'Khalifa Shareif' },
  { id: '5', name: 'Mutwali' },
];

const BusinessApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses' | 'invoices' | 'clients'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>(predefinedClients);

  const defaultNewOrderState: Omit<Order, 'id' | 'paid'> = {
    date: new Date().toISOString().split('T')[0],
    vehicle: '',
    clientName: predefinedClients[0]?.name || '',
    orderType: '', // Default to blank for free text
    location: '',
    cost: 0,
    price: 0,
    paymentMethod: 'Cash',
  };

  const defaultNewExpenseState: Omit<Expense, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    plateNumber: '',
    type: 'Diesel',
    cost: 0,
    description: '',
  };

  const [newOrder, setNewOrder] = useState<Omit<Order, 'id' | 'paid'>>(defaultNewOrderState);
  const [orderPaid, setOrderPaid] = useState<boolean>(true);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>(defaultNewExpenseState);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const [newClientName, setNewClientName] = useState<string>('');
  const [showAddClientInput, setShowAddClientInput] = useState<boolean>(false);

  const [selectedClientForInvoice, setSelectedClientForInvoice] = useState<string>('');
  const [selectedMonthForInvoice, setSelectedMonthForInvoice] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM

  const invoiceRef = useRef<HTMLDivElement>(null);
  const orderFormRef = useRef<HTMLDivElement>(null);
  const expenseFormRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedOrders = localStorage.getItem('businessAppOrders');
    const storedExpenses = localStorage.getItem('businessAppExpenses');
    const storedClients = localStorage.getItem('businessAppClients');

    if (storedOrders) setOrders(JSON.parse(storedOrders));
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedClients) {
      const parsedClients = JSON.parse(storedClients);
      setClients(parsedClients);
      // Set default selected client for invoice if clients exist
      if (parsedClients.length > 0) {
        setSelectedClientForInvoice(parsedClients[0].name);
        setNewOrder(prev => ({ ...prev, clientName: parsedClients[0].name }));
      } else if (predefinedClients.length > 0) {
        setSelectedClientForInvoice(predefinedClients[0].name);
        setNewOrder(prev => ({ ...prev, clientName: predefinedClients[0].name }));
      }
    } else if (predefinedClients.length > 0) {
      setSelectedClientForInvoice(predefinedClients[0].name);
      setNewOrder(prev => ({ ...prev, clientName: predefinedClients[0].name }));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('businessAppOrders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('businessAppExpenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('businessAppClients', JSON.stringify(clients));
  }, [clients]);

  const handleSaveOrder = () => {
    if (!newOrder.date || !newOrder.clientName || !newOrder.vehicle || newOrder.price <= 0) {
      alert('Please fill in all required order fields (Date, Client, Vehicle, Price).');
      return;
    }

    if (editingOrderId) {
      // Edit existing order
      setOrders((prev) =>
        prev.map((order) =>
          order.id === editingOrderId ? { ...newOrder, id: editingOrderId, paid: orderPaid } : order
        )
      );
      setEditingOrderId(null);
    } else {
      // Add new order
      const orderToAdd: Order = {
        ...newOrder,
        id: Date.now().toString(),
        paid: orderPaid,
      };
      setOrders((prev) => [...prev, orderToAdd]);
    }
    setNewOrder(defaultNewOrderState);
    setOrderPaid(true);
  };

  const handleEditOrder = (id: string) => {
    const orderToEdit = orders.find((order) => order.id === id);
    if (orderToEdit) {
      setNewOrder({
        date: orderToEdit.date,
        vehicle: orderToEdit.vehicle,
        clientName: orderToEdit.clientName,
        orderType: orderToEdit.orderType,
        location: orderToEdit.location,
        cost: orderToEdit.cost,
        price: orderToEdit.price,
        paymentMethod: orderToEdit.paymentMethod,
      });
      setOrderPaid(orderToEdit.paid);
      setEditingOrderId(id);
      if (orderFormRef.current) {
        orderFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      setOrders((prev) => prev.filter((order) => order.id !== id));
      if (editingOrderId === id) {
        setEditingOrderId(null);
        setNewOrder(defaultNewOrderState);
        setOrderPaid(true);
      }
    }
  };

  const handleCancelEditOrder = () => {
    setEditingOrderId(null);
    setNewOrder(defaultNewOrderState);
    setOrderPaid(true);
  };

  const handleSaveExpense = () => {
    if (!newExpense.date || !newExpense.plateNumber || newExpense.cost <= 0) {
      alert('Please fill in all required expense fields (Date, Plate Number, Cost).');
      return;
    }

    if (editingExpenseId) {
      // Edit existing expense
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.id === editingExpenseId ? { ...newExpense, id: editingExpenseId } : expense
        )
      );
      setEditingExpenseId(null);
    } else {
      // Add new expense
      const expenseToAdd: Expense = {
        ...newExpense,
        id: Date.now().toString(),
      };
      setExpenses((prev) => [...prev, expenseToAdd]);
    }
    setNewExpense(defaultNewExpenseState);
  };

  const handleEditExpense = (id: string) => {
    const expenseToEdit = expenses.find((expense) => expense.id === id);
    if (expenseToEdit) {
      setNewExpense({
        date: expenseToEdit.date,
        plateNumber: expenseToEdit.plateNumber,
        type: expenseToEdit.type,
        cost: expenseToEdit.cost,
        description: expenseToEdit.description,
      });
      setEditingExpenseId(id);
      if (expenseFormRef.current) {
        expenseFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      if (editingExpenseId === id) {
        setEditingExpenseId(null);
        setNewExpense(defaultNewExpenseState);
      }
    }
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setNewExpense(defaultNewExpenseState);
  };

  const handleAddClient = () => {
    if (newClientName.trim() === '') {
      alert('Client name cannot be empty.');
      return;
    }
    if (clients.some((c) => c.name.toLowerCase() === newClientName.trim().toLowerCase())) {
      alert('Client with this name already exists.');
      return;
    }
    const clientToAdd: Client = { id: Date.now().toString(), name: newClientName.trim() };
    setClients((prev) => {
      const updatedClients = [...prev, clientToAdd];
      // If no client was selected for invoice, or if this is the first client, set this new one as default
      if (prev.length === 0 || !selectedClientForInvoice) {
        setSelectedClientForInvoice(clientToAdd.name);
      }
      setNewOrder(prevOrder => ({ ...prevOrder, clientName: clientToAdd.name })); // Set new client as selected in order form
      return updatedClients;
    });
    setNewClientName('');
    setShowAddClientInput(false);
  };

  const handleRemoveClient = (id: string) => {
    if (confirm('Are you sure you want to remove this client? This will not delete their past orders.')) {
      setClients((prev) => {
        const updatedClients = prev.filter((c) => c.id !== id);
        // If the removed client was selected for invoice, reset selection to first available or empty
        if (selectedClientForInvoice === prev.find(c => c.id === id)?.name) {
          setSelectedClientForInvoice(updatedClients[0]?.name || '');
        }
        // Also update newOrder clientName if the removed client was selected
        if (newOrder.clientName === prev.find(c => c.id === id)?.name) {
          setNewOrder(prevOrder => ({ ...prevOrder, clientName: updatedClients[0]?.name || '' }));
        }
        return updatedClients;
      });
    }
  };

  const generateInvoicePdf = async () => {
    if (!selectedClientForInvoice || !selectedMonthForInvoice) {
      alert('Please select a client and a month to generate the invoice.');
      return;
    }

    const filteredOrders = orders.filter(
      (order) =>
        order.clientName === selectedClientForInvoice &&
        order.date.startsWith(selectedMonthForInvoice)
    );

    if (filteredOrders.length === 0) {
      alert('No orders found for the selected client and month.');
      return;
    }

    // Ensure the invoice content is visible for html2canvas to capture
    if (invoiceRef.current) {
      invoiceRef.current.style.display = 'block';
      invoiceRef.current.style.position = 'absolute';
      invoiceRef.current.style.left = '-9999px';
      invoiceRef.current.style.top = '-9999px';
    }

    // Give a slight delay for the DOM to update before capturing
    await new Promise(resolve => setTimeout(resolve, 50));

    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Increase scale for better quality
        useCORS: true, // If you have images from other origins
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${selectedClientForInvoice}_Invoice_${selectedMonthForInvoice}.pdf`);

      // Hide the invoice content again
      invoiceRef.current.style.display = 'none';
      invoiceRef.current.style.position = 'static';
      invoiceRef.current.style.left = 'auto';
      invoiceRef.current.style.top = 'auto';
    }
  };

  const getMonths = () => {
    const months: string[] = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toISOString().substring(0, 7));
    }
    return months;
  };

  const calculateBalance = (order: Order) => {
    return order.paymentMethod === 'Postpaid' && !order.paid ? order.price : 0;
  };

  const totalUnpaidAmount = orders.filter(
    (order) =>
      order.clientName === selectedClientForInvoice &&
      order.date.startsWith(selectedMonthForInvoice) &&
      order.paymentMethod === 'Postpaid' &&
      !order.paid
  ).reduce((sum, order) => sum + order.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8 font-sans">
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-700 mb-6 sm:mb-8">
        Business Dashboard
      </h1>

      <div className="flex justify-around bg-white p-1 sm:p-2 rounded-xl shadow-md mb-6 sm:mb-8 max-w-screen-lg mx-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base font-medium rounded-lg transition-colors duration-200
            ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50'}`}
        >
          Orders
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base font-medium rounded-lg transition-colors duration-200
            ${activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50'}`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base font-medium rounded-lg transition-colors duration-200
            ${activeTab === 'invoices' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50'}`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base font-medium rounded-lg transition-colors duration-200
            ${activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-700 hover:bg-indigo-50'}`}
        >
          Clients
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 sm:mb-8 max-w-screen-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">
            {editingOrderId ? 'Edit Order' : 'Add New Order'}
          </h2>
          <div ref={orderFormRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="orderDate" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="orderDate"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.date}
                onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="orderVehicle" className="block text-sm font-medium text-gray-700">Vehicle</label>
              <input
                type="text"
                id="orderVehicle"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.vehicle}
                onChange={(e) => setNewOrder({ ...newOrder, vehicle: e.target.value })}
                placeholder="e.g., Truck A"
              />
            </div>
            <div>
              <label htmlFor="orderClient" className="block text-sm font-medium text-gray-700">Client Name</label>
              <select
                id="orderClient"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.clientName}
                onChange={(e) => {
                  if (e.target.value === 'add_new') {
                    setShowAddClientInput(true);
                    setNewOrder({ ...newOrder, clientName: '' }); // Clear client name for new input
                  } else {
                    setShowAddClientInput(false);
                    setNewOrder({ ...newOrder, clientName: e.target.value });
                  }
                }}
              >
                {clients.length === 0 && <option value="">No clients available</option>}
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
                <option value="add_new">+ Add New Client</option>
              </select>
              {showAddClientInput && (
                <div className="mt-2 flex">
                  <input
                    type="text"
                    className="flex-grow p-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="New Client Name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                  <button
                    onClick={handleAddClient}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-r-md hover:bg-indigo-600 transition-colors duration-200"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="orderType" className="block text-sm font-medium text-gray-700">Order Type</label>
              <input
                type="text"
                id="orderType"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.orderType}
                onChange={(e) => setNewOrder({ ...newOrder, orderType: e.target.value })}
                placeholder="e.g., Delivery, Pickup, Service"
              />
            </div>
            <div>
              <label htmlFor="orderLocation" className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                id="orderLocation"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.location}
                onChange={(e) => setNewOrder({ ...newOrder, location: e.target.value })}
                placeholder="e.g., City Center"
              />
            </div>
            <div>
              <label htmlFor="orderCost" className="block text-sm font-medium text-gray-700">Cost</label>
              <input
                type="number"
                id="orderCost"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.cost}
                onChange={(e) => setNewOrder({ ...newOrder, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label htmlFor="orderPrice" className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                id="orderPrice"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.price}
                onChange={(e) => setNewOrder({ ...newOrder, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                id="paymentMethod"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newOrder.paymentMethod}
                onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash</option>
                <option value="Postpaid">Postpaid</option>
              </select>
            </div>
            <div>
              <label htmlFor="orderPaid" className="block text-sm font-medium text-gray-700">Paid?</label>
              <select
                id="orderPaid"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={orderPaid ? 'Yes' : 'No'}
                onChange={(e) => setOrderPaid(e.target.value === 'Yes')}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSaveOrder}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors duration-200 font-semibold"
            >
              {editingOrderId ? 'Save Changes' : 'Add Order'}
            </button>
            {editingOrderId && (
              <button
                onClick={handleCancelEditOrder}
                className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-semibold"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mt-8 mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-gray-600">No orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-md">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-4 sm:px-6 text-left">Date</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Client</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Vehicle</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Price</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Payment</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Paid</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {orders.slice().reverse().map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-4 sm:px-6 text-left whitespace-nowrap">{order.date}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">{order.clientName}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">{order.vehicle}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">${order.price.toFixed(2)}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">{order.paymentMethod}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">
                        <span className={`py-1 px-2 rounded-full text-xs ${order.paid ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {order.paid ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-2 px-4 sm:px-6 text-center">
                        <div className="flex item-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditOrder(order.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 sm:mb-8 max-w-screen-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">
            {editingExpenseId ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <div ref={expenseFormRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="expenseDate" className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                id="expenseDate"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">Plate Number</label>
              <input
                type="text"
                id="plateNumber"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newExpense.plateNumber}
                onChange={(e) => setNewExpense({ ...newExpense, plateNumber: e.target.value })}
                placeholder="e.g., ABC 123"
              />
            </div>
            <div>
              <label htmlFor="expenseType" className="block text-sm font-medium text-gray-700">Type</label>
              <select
                id="expenseType"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newExpense.type}
                onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as ExpenseType })}
              >
                <option value="Diesel">Diesel</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Salary">Salary</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="expenseCost" className="block text-sm font-medium text-gray-700">Cost</label>
              <input
                type="number"
                id="expenseCost"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newExpense.cost}
                onChange={(e) => setNewExpense({ ...newExpense, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="expenseDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="expenseDescription"
                rows={3}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Brief description of the expense"
              ></textarea>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleSaveExpense}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors duration-200 font-semibold"
            >
              {editingExpenseId ? 'Save Changes' : 'Add Expense'}
            </button>
            {editingExpenseId && (
              <button
                onClick={handleCancelEditExpense}
                className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-semibold"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mt-8 mb-4">Recent Expenses</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-600">No expenses recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-md">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-4 sm:px-6 text-left">Date</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Plate No.</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Type</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Cost</th>
                    <th className="py-3 px-4 sm:px-6 text-left">Description</th>
                    <th className="py-3 px-4 sm:px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {expenses.slice().reverse().map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-4 sm:px-6 text-left whitespace-nowrap">{expense.date}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">{expense.plateNumber}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">{expense.type}</td>
                      <td className="py-2 px-4 sm:px-6 text-left">${expense.cost.toFixed(2)}</td>
                      <td className="py-2 px-4 sm:px-6 text-left max-w-xs overflow-hidden text-ellipsis">{expense.description}</td>
                      <td className="py-2 px-4 sm:px-6 text-center">
                        <div className="flex item-center justify-center space-x-2">
                          <button
                            onClick={() => handleEditExpense(expense.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-600 transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 sm:mb-8 max-w-screen-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Generate Client Invoice</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="invoiceClient" className="block text-sm font-medium text-gray-700">Select Client</label>
              <select
                id="invoiceClient"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedClientForInvoice}
                onChange={(e) => setSelectedClientForInvoice(e.target.value)}
              >
                {clients.length === 0 && <option value="">No clients available</option>}
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="invoiceMonth" className="block text-sm font-medium text-gray-700">Select Month</label>
              <select
                id="invoiceMonth"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                value={selectedMonthForInvoice}
                onChange={(e) => setSelectedMonthForInvoice(e.target.value)}
              >
                {getMonths().map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleString('en-US', { year: 'numeric', month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={generateInvoicePdf}
            className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 transition-colors duration-200 font-semibold"
            disabled={!selectedClientForInvoice}
          >
            Generate PDF Invoice
          </button>

          {/* Hidden div for PDF generation - uses inline style for specific print dimensions (A4) */}
          <div ref={invoiceRef} className="p-8 bg-white text-gray-800" style={{ display: 'none', width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold uppercase tracking-wide mb-2">{selectedClientForInvoice.toUpperCase()}</h1>
              <p className="text-lg text-gray-600">{new Date(selectedMonthForInvoice + '-01').toLocaleString('en-US', { year: 'numeric', month: 'long' })}</p>
              <h2 className="text-xl font-bold mt-4">STATEMENT OF ACCOUNT</h2>
            </div>

            <table className="w-full border-collapse mb-8">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="py-2 px-4 text-left text-sm font-semibold">Date</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold">Vehicle</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold">Order Type</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold">Location</th>
                  <th className="py-2 px-4 text-right text-sm font-semibold">Price</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold">Payment Method</th>
                  <th className="py-2 px-4 text-right text-sm font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(
                  (order) =>
                    order.clientName === selectedClientForInvoice &&
                    order.date.startsWith(selectedMonthForInvoice)
                ).map((order) => (
                  <tr key={order.id} className="border-b border-gray-200">
                    <td className="py-2 px-4 text-sm">{order.date}</td>
                    <td className="py-2 px-4 text-sm">{order.vehicle}</td>
                    <td className="py-2 px-4 text-sm">{order.orderType}</td>
                    <td className="py-2 px-4 text-sm">{order.location}</td>
                    <td className="py-2 px-4 text-right text-sm">${order.price.toFixed(2)}</td>
                    <td className="py-2 px-4 text-sm">{order.paymentMethod}</td>
                    <td className="py-2 px-4 text-right text-sm">${calculateBalance(order).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={6} className="py-2 px-4 text-right text-base font-semibold">Total Unpaid Amount:</td>
                  <td className="py-2 px-4 text-right text-base font-bold">${totalUnpaidAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-12 border-t border-gray-300 pt-4">
              <p className="text-sm mb-2">Amount Paid (Total/Partial/None): _________________________________</p>
              <p className="text-sm">Balance Carried Forward to Next Month: _________________________________</p>
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 sm:mb-8 max-w-screen-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 mb-4">Manage Clients</h2>
          <div className="flex mb-6">
            <input
              type="text"
              className="flex-grow p-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add new client name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
            <button
              onClick={handleAddClient}
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition-colors duration-200 font-semibold"
            >
              Add Client
            </button>
          </div>

          {clients.length === 0 ? (
            <p className="text-gray-600">No clients added yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {clients.map((client) => (
                <li key={client.id} className="py-3 flex justify-between items-center">
                  <span className="text-base text-gray-800">{client.name}</span>
                  <button
                    onClick={() => handleRemoveClient(client.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Data is saved locally in your browser. For cloud sync, a backend integration would be required.</p>
      </div>
    </div>
  );
};

export default BusinessApp;
