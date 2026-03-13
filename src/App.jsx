import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NewsletterEditor from './components/NewsletterEditor';
import NewsletterList from './components/NewsletterList';
import SubscriberImport from './components/SubscriberImport';
import ImportExport from './components/ImportExport';
import TemplateEditor from './components/TemplateEditor';
import TemplateList from './components/TemplateList';
import ABTestManager from './components/ABTestManager';
import AutomationBuilder from './components/AutomationBuilder';
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
          <Route path="/import-export" element={<ImportExport />} />
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/templates/new" element={<TemplateEditor />} />
          <Route path="/templates/:id/edit" element={<TemplateEditor />} />
          <Route path="/ab-tests" element={<ABTestManager />} />
          <Route path="/automations" element={<AutomationBuilder />} />
          <Route path="/automations/new" element={<AutomationBuilder />} />
          <Route path="/automations/:id" element={<AutomationBuilder />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
