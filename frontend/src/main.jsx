import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import LabTargetViewer, { isLabTargetPath } from './components/student/LabTargetViewer.jsx';
import { installLiveReadOnlyGuard } from './api/liveReadOnly';

installLiveReadOnlyGuard();

// "/target_environment/" is the full-screen lab environment opened in a new tab from a lab page
const isLabTarget = isLabTargetPath(window.location.pathname);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLabTarget ? <LabTargetViewer /> : <App />}
  </React.StrictMode>
);
