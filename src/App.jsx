import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NewsletterEditor from './components/NewsletterEditor';
import NewsletterList from './components/NewsletterList';
import SubscriberImport from './components/SubscriberImport';
import TemplateEditor from './components/TemplateEditor';
import TemplateList from './components/TemplateList';
import ABTestManager from './components/ABTestManager';
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
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/templates/new" element={<TemplateEditor />} />
          <Route path="/templates/:id/edit" element={<TemplateEditor />} />
          <Route path="/ab-tests" element={<ABTestManager />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
