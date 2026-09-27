import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Enquiries from "./pages/Enquiries";
import Quotations from "./pages/Quotations";
import SalesOrders from "./pages/SalesOrders";
import Inventory from "./pages/Inventory";
import Dispatches from "./pages/Dispatches";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/login"
          element={
            token ? <Navigate to="/dashboard" /> : <Login />
          }
        />

        <Route
          path="/dashboard"
          element={
            token ? <Dashboard /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/customers"
          element={
            token ? <Customers /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/enquiries"
          element={
            token ? <Enquiries /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/quotations"
          element={
            token ? <Quotations /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/sales-orders"
          element={
            token ? <SalesOrders /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/inventory"
          element={token ? <Inventory /> : <Navigate to="/login" />}
        />

        <Route
          path="/dispatches"
          element={token ? <Dispatches /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;