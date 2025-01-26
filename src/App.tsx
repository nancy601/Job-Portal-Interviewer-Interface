import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AssessmentCreator from './components/AssessmentCreator';
import AssessmentCreated from './components/AssessmentCreated';
import { ToastProvider, ToastContainer } from './components/ui/use-toast';

function App() {
  return (
    <Router>
      <div className="App">
      <ToastProvider>
      <ToastContainer/>
      <Routes>
          <Route path="/" element={<AssessmentCreator />} />
          <Route path="/promote-assessment-created/:job_id" element={<AssessmentCreated />} />
          </Routes>
      </ToastProvider>
      </div>
    </Router>
  );
}

export default App;