import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NewsletterEditor from './components/NewsletterEditor';
import NewsletterList from './components/NewsletterList';
import SubscriberImport from './components/SubscriberImport';
import './styles/app.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/newsletters" replace />} />
          <Route path="/newsletters" element={<NewsletterList />} />
          <Route path="/newsletters/new" element={<NewsletterEditor />} />
          <Route path="/newsletters/:id/edit" element={<NewsletterEditor />} />
          <Route path="/subscribers/import" element={<SubscriberImport />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
