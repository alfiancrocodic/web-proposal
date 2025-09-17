"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ShimmerBox, ShimmerCard } from '@/components/ShimmerEffect';
import { 
  getProject, 
  getClient, 
  getProposals, 
  createProposal,
  Project, 
  Client, 
  Proposal 
} from '@/lib/api';

// Interface untuk role dalam project
interface Role {
  name: string;
  platforms: string[];
  platform?: string; // untuk backward compatibility
}

/**
 * Komponen halaman detail project
 * @returns React component untuk menampilkan detail project
 */
export default function ProjectDetailsPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingProposal, setIsCreatingProposal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
      router.replace('/login');
      return;
    }
    if (!id) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const projectData = await getProject(id as string);
        setProject(projectData);
        
        if (projectData.client_id) {
          const clientData = await getClient(projectData.client_id);
          setClient(clientData);
        }
        
        const proposalsData = await getProposals();
        // Filter proposals untuk project ini
        const projectProposals = proposalsData.filter((p: any) => p.project_id == id);
        setProposals(projectProposals);
      } catch (error) {
        console.error('Error loading project data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router, id]);

  /**
   * Fungsi untuk membuat proposal baru
   */
  const handleCreateProposal = async (): Promise<void> => {
    try {
      setIsCreatingProposal(true);
      const proposalData = {
        project_id: id as string,
        version: String(proposals.length + 1)
      };
      
      const newProposal = await createProposal(proposalData);
      router.push(`/projects/${id}/proposals/${newProposal.id}/edit`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Gagal membuat proposal. Silakan coba lagi.');
    } finally {
      setIsCreatingProposal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
          {/* Breadcrumbs shimmer */}
          <div className="flex items-center space-x-2">
            <ShimmerBox className="w-16 h-5" />
            <span className="text-gray-400">/</span>
            <ShimmerBox className="w-20 h-5" />
            <span className="text-gray-400">/</span>
            <ShimmerBox className="w-32 h-5" />
          </div>
          
          {/* Header shimmer */}
          <div className="flex justify-between items-start">
            <div>
              <ShimmerBox className="w-80 h-9 mb-2" />
              <ShimmerBox className="w-96 h-5" />
            </div>
          </div>

          {/* Content grid shimmer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Information Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <ShimmerBox className="w-40 h-6" />
                <ShimmerBox className="w-24 h-9" />
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <ShimmerBox className="w-20 h-4 mb-1" />
                    <ShimmerBox className="w-32 h-5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Proposals Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <ShimmerBox className="w-20 h-6" />
                <div className="flex items-center gap-2">
                  <ShimmerBox className="w-10 h-9" />
                  <ShimmerBox className="w-32 h-9" />
                </div>
              </div>
              <div className="space-y-2">
                {/* Table header */}
                <div className="bg-gray-50 px-4 py-3 grid grid-cols-3 gap-4">
                  <ShimmerBox className="w-16 h-4" />
                  <ShimmerBox className="w-20 h-4" />
                  <ShimmerBox className="w-12 h-4" />
                </div>
                {/* Table rows */}
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 grid grid-cols-3 gap-4 border-b border-gray-200">
                    <ShimmerBox className="w-20 h-5" />
                    <ShimmerBox className="w-24 h-5" />
                    <ShimmerBox className="w-10 h-5" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white min-h-screen">
        <Header />
        <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
          <div className="text-center text-gray-500">Project tidak ditemukan</div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
        <Breadcrumbs crumbs={["Home", "Project", project.name]} />
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-sm text-gray-500">All-inclusive vacations and flights to the Caribbean</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Project Information</h2>
              <button onClick={() => router.push(`/projects/${id}/edit`)} className="text-sm bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">Edit Project</button>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <p className="text-gray-500">Created Date</p>
                <p className="font-medium text-gray-800">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Analyst</p>
                <p className="font-medium text-gray-800">{project.analyst}</p>
              </div>
              <div>
                <p className="text-gray-500">Company Name</p>
                <p className="font-medium text-gray-800">{client?.company || ''}</p>
              </div>
              <div>
                <p className="text-gray-500">PIC Name</p>
                <p className="font-medium text-gray-800">{client?.picName || ''}</p>
              </div>
              <div>
                <p className="text-gray-500">Project Grade</p>
                <p className="font-medium text-gray-800">{project.grade}</p>
              </div>
              <div>
                <p className="text-gray-500">Project User Role</p>
                <div className="mt-1 space-y-3">
                  {Array.isArray(project.roles) && project.roles.length > 0 ? (
                    project.roles.map((r, idx) => {
                      // Support both new format ({name, platforms}) and legacy strings
                      if (typeof r === 'string') {
                        return (
                          <div key={`${r}-${idx}`} className="flex flex-wrap items-center gap-2">
                            <span className="bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">User</span>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">{r}</span>
                          </div>
                        );
                      }
                      const platforms = Array.isArray(r.platforms) ? r.platforms : (r.platform ? [r.platform] : []);
                      return (
                        <div key={`${r.name || 'Role'}-${idx}`} className="">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">{r.name || 'Role'}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {platforms.map((p, pIdx) => (
                              <span key={`${p}-${pIdx}`} className={`bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full`}>{p}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-gray-500">No roles</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Proposal</h2>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md border hover:bg-gray-100" title="More actions">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </button>
                <button onClick={handleCreateProposal} disabled={isCreatingProposal} className="text-sm bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2">
                  {isCreatingProposal ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                      Create Proposal
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Create Date</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((item) => (
                    <tr key={item.id} className="bg-white border-b border-gray-200">
                      <td className="px-4 py-3 font-medium text-gray-900">Version {item.version}</td>
                      <td className="px-4 py-3">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3">
                        <button className="font-medium text-blue-600 hover:underline" onClick={()=>router.push(`/projects/${id}/proposals/${item.id}/edit`)}>Open</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
