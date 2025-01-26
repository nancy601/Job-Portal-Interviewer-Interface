import { useParams } from 'react-router-dom';

export default function AssessmentCreated() {
  const { job_id } = useParams();  // Get the job_id from the URL

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-4">
      <h1>Promote Assessment Created</h1>
      <p>Your assessment has been created with Job ID: {job_id}</p>
    </div>
  );
}
