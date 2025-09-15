"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getProjects, getClients, Project, Client } from '@/lib/api';

/**
 * Halaman utama untuk menampilkan daftar projects
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Load data projects dan clients dari backend
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
      router.replace('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [projectsData, clientsData] = await Promise.all([
          getProjects(),
          getClients()
        ]);
        setProjects(projectsData);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  /**
   * Fungsi untuk mendapatkan nama company dari client
   * @param clientId - ID client
   * @returns Nama company atau string kosong
   */
  const getClientCompany = (clientId: number | string): string => {
    const client = clients.find(c => c.id == clientId);
    return client?.company || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <button
            onClick={() => router.push('/projects/new')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No projects found</div>
            <button
              onClick={() => router.push('/projects/new')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.grade === 'A' ? 'bg-green-100 text-green-800' :
                    project.grade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Grade {project.grade}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {project.client?.company || getClientCompany(String(project.client_id))}
                </p>
                <p className="text-sm text-gray-500 mb-4">Analyst: {project.analyst}</p>
                
                {project.roles && project.roles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Roles:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.roles.slice(0, 3).map((role, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {role}
                        </span>
                      ))}
                      {project.roles.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{project.roles.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <button className="w-full text-blue-600 font-semibold text-sm flex items-center justify-center hover:text-blue-800 transition-colors">
                  View Details
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
