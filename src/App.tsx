import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import LazyRoute from './components/LazyRoute';
import EventNotice from './components/EventNotice';
import FloatingSocialMenu from './components/FloatingSocialMenu';
import './index.css';

// Lazy load all pages for better performance
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Programs = lazy(() => import('./pages/Programs'));
const Events = lazy(() => import('./pages/Events'));
const Support = lazy(() => import('./pages/Donate'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Impact = lazy(() => import('./pages/Impact'));
const Management = lazy(() => import('./pages/Management'));
const Contact = lazy(() => import('./pages/Contact'));
const Consultation = lazy(() => import('./pages/Consultation'));
const Quote = lazy(() => import('./pages/Quote'));
// const Admin = lazy(() => import('./pages/Admin'));

// Component to handle showing event notice only on the home page
const AppContent = () => {
  const location = useLocation();
  const [showEventNotice, setShowEventNotice] = useState(false);

  useEffect(() => {
    // Only show on home page
    setShowEventNotice(location.pathname === '/');
  }, [location]);

  return (
    <>
      <ScrollToTop />
      <Navbar />
      {showEventNotice && <EventNotice />}
      <Routes>
        <Route
          path="/"
          element={
            <LazyRoute>
              <Home />
            </LazyRoute>
          }
        />
        <Route
          path="/about"
          element={
            <LazyRoute>
              <About />
            </LazyRoute>
          }
        />
        <Route
          path="/programs"
          element={
            <LazyRoute>
              <Programs />
            </LazyRoute>
          }
        />
        <Route
          path="/events"
          element={
            <LazyRoute>
              <Events />
            </LazyRoute>
          }
        />
        <Route path="/donate" element={
          <LazyRoute>
            <Support />
          </LazyRoute>
        } />
        <Route
          path="/volunteer"
          element={
            <LazyRoute>
              <Volunteer />
            </LazyRoute>
          }
        />
        <Route
          path="/impact"
          element={
            <LazyRoute>
              <Impact />
            </LazyRoute>
          }
        />
        <Route
          path="/management"
          element={
            <LazyRoute>
              <Management />
            </LazyRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <LazyRoute>
              <Contact />
            </LazyRoute>
          }
        />
        <Route
          path="/consultation"
          element={
            <LazyRoute>
              <Consultation />
            </LazyRoute>
          }
        />
        <Route
          path="/quote"
          element={
            <LazyRoute>
              <Quote />
            </LazyRoute>
          }
        />
        {/* <Route path="/admin" element={
          <LazyRoute>
            <Admin />
          </LazyRoute>
        } /> */}
      </Routes>
      <Footer />
      <FloatingSocialMenu />
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <AppContent />
        </Suspense>
      </div>
    </Router>
  );
}

export default App;