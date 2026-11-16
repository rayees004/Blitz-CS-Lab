import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import LabTargetViewer from './components/student/LabTargetViewer.jsx';
import { installLiveReadOnlyGuard } from './api/liveReadOnly';

installLiveReadOnlyGuard();

// "?lab-target=<lab id>" is the full-screen lab environment opened in a new tab from a lab page
const labTargetId = new URLSearchParams(window.location.search).get('lab-target');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {labTargetId ? <LabTargetViewer labId={labTargetId} /> : <App />}
  </React.StrictMode>
);
