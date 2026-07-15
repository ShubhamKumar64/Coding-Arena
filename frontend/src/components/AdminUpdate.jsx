import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router';

const AdminUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4 max-w-4xl mx-auto">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-base-content mb-1">
            Update Problems
          </h1>
          <p className="text-base-content/75 text-sm">
            Select a problem from the list below to update its details, test cases, or templates.
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin')} 
          className="btn btn-outline btn-sm gap-2"
        >
          Back to Admin
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="bg-base-200">
                <th className="w-1/12 font-bold">#</th>
                <th className="w-5/12 font-bold">Title</th>
                <th className="w-2/12 font-bold">Difficulty</th>
                <th className="w-2/12 font-bold">Tags</th>
                <th className="w-2/12 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-base-content/50">
                    No problems found.
                  </td>
                </tr>
              ) : (
                problems.map((problem, index) => (
                  <tr key={problem._id} className="hover:bg-base-200/50 transition-colors">
                    <th>{index + 1}</th>
                    <td className="font-medium text-base-content">{problem.title}</td>
                    <td>
                      <span className={`badge uppercase text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        problem.difficulty === 'easy' 
                          ? 'badge-success text-success-content' 
                          : problem.difficulty === 'medium' 
                            ? 'badge-warning text-warning-content' 
                            : 'badge-error text-error-content'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-outline capitalize text-xs">
                        {problem.tags}
                      </span>
                    </td>
                    <td className="text-center">
                      <button 
                        onClick={() => navigate(`/admin/update/${problem._id}`)}
                        className="btn btn-sm btn-warning gap-1 px-4"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdate;
