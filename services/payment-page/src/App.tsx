import { Routes, Route } from 'react-router-dom';
import PaymentPage from './pages/PaymentPage';

function App() {
  return (
    <Routes>
      <Route path="/pay/:checkoutId" element={<PaymentPage />} />
      <Route path="/:checkoutId" element={<PaymentPage />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center p-8">
              <h1 className="text-2xl font-semibold text-text-primary mb-2">
                Invalid Payment Link
              </h1>
              <p className="text-text-secondary">
                Please use a valid checkout link to complete your payment.
              </p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
