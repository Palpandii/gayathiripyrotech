import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Home from './pages/Home.jsx'
import Products from './pages/Products.jsx'
import Categories from './pages/Categories.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import AboutUs from './pages/AboutUs.jsx'
import ContactUs from './pages/ContactUs.jsx'
import FireworksOverlay from './components/FireworksOverlay.jsx'

import './admin/admin.css'
import { AdminAuthProvider } from './admin/AdminAuthContext.jsx'
import ProtectedRoute from './admin/ProtectedRoute.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminLogin from './admin/pages/AdminLogin.jsx'
import ProductsTab from './admin/pages/ProductsTab.jsx'
import OrdersTab from './admin/pages/OrdersTab.jsx'
import EstimatesTab from './admin/pages/EstimatesTab.jsx'
import CategoriesTab from './admin/pages/CategoriesTab.jsx'
import BannerTab from './admin/pages/BannerTab.jsx'


function Storefront() {
  return (
    <>
      <FireworksOverlay />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}

function AdminSection() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<ProductsTab />} />
          <Route path="orders" element={<OrdersTab />} />
          <Route path="estimates" element={<EstimatesTab />} />
          <Route path="categories" element={<CategoriesTab />} />
          <Route path="banner" element={<BannerTab />} />

        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminSection />} />
      </Routes>
    )
  }

  return <Storefront />
}