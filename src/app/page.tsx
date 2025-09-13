"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import React from 'react';

/**
 * Interface untuk data client
 */
interface Client {
  id: string;
  company: string;
  location: string;
  badanUsaha: string;
  picName: string;
  position: string;
}

/**
 * Interface untuk data project
 */
interface Project {
  id: string;
  name: string;
  clientId: string;
  analyst: string;
  grade: string;
}

/**
 * Interface untuk form data client
 */
interface ClientForm {
  company: string;
  location: string;
  badanUsaha: string;
  picName: string;
  position: string;
}

/**
 * Komponen halaman utama aplikasi Proposal Manager
 * Menampilkan daftar client, project, dan form untuk menambah client baru
 */
export default function Home(): React.JSX.Element {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ClientForm>({ company: '', location: '', badanUsaha: 'Swasta', picName: '', position: '' });
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [newClient, setNewClient] = useState<Client | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
      router.replace('/login');
      return;
    }
    fetch('/api/clients').then(r => r.json()).then(setClients);
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, [router]);

  /**
   * Memo untuk mendapatkan suggestions client berdasarkan input company
   */
  const suggestions = useMemo((): Client[] => {
    if (!form.company) return [];
    return clients.filter((c: Client) => c.company.toLowerCase().includes(form.company.toLowerCase())).slice(0, 5);
  }, [clients, form.company]);

  /**
   * Fungsi untuk menyimpan client baru
   * @param e - Form submit event
   */
  const saveClient = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const c: Client = await res.json();
    if (res.ok) {
      setNewClient(c);
      setShowConfirm(true);
      setClients((prev: Client[]) => [c, ...prev]);
    }
  };

  /**
   * Fungsi untuk konfirmasi dan redirect ke halaman tambah project
   */
  const confirmAndAddProject = (): void => {
    setShowConfirm(false);
    if (newClient) router.push(`/projects/new?clientId=${newClient.id}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Add New Client */}
        <form onSubmit={saveClient} className="p-6 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg text-white shadow-lg">
          <h2 className="text-2xl font-bold">Add new client</h2>
          <p className="opacity-80">Don't worry, we don't spam 🥳</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="col-span-1 lg:col-span-1 relative">
              <label className="block text-sm font-medium">Company</label>
              <input value={form.company} onChange={e=>setForm({...form, company:e.target.value})}
                onFocus={()=>setShowSuggestions(true)} onBlur={()=>setTimeout(()=>setShowSuggestions(false), 120)}
                className="mt-1 w-full text-gray-900 text-sm rounded-lg p-2.5 bg-white shadow-sm" placeholder="Company name" />
              {showSuggestions && form.company && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg text-black">
                  <ul className="py-1 text-sm text-gray-700">
                    {suggestions.map(s => (
                      <li key={s.id}>
                        <button type="button" className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={()=>{setForm({...form, company:s.company}); setShowSuggestions(false);}}>{s.company}</button>
                      </li>
                    ))}
                    <li className="border-t">
                      <button type="button" className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-gray-50" onClick={()=>setShowSuggestions(false)}>
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                        Tambah data "{form.company}"
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Location</label>
              <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} className="mt-1 w-full text-gray-900 text-sm rounded-lg p-2.5 bg-white shadow-sm" placeholder="Location" />
            </div>
            <div>
              <label className="block text-sm font-medium">Badan Usaha</label>
              <select value={form.badanUsaha} onChange={e=>setForm({...form, badanUsaha:e.target.value})} className="mt-1 w-full text-gray-900 text-sm rounded-lg p-2.5 bg-white shadow-sm">
                <option>Swasta</option>
                <option>Pemerintah</option>
                <option>Personal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">PIC Name</label>
              <input value={form.picName} onChange={e=>setForm({...form, picName:e.target.value})} className="mt-1 w-full text-gray-900 text-sm rounded-lg p-2.5 bg-white shadow-sm" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium">Position</label>
              <input value={form.position} onChange={e=>setForm({...form, position:e.target.value})} className="mt-1 w-full text-gray-900 text-sm rounded-lg p-2.5 bg-white shadow-sm" placeholder="Position" />
            </div>
            <div>
              <button className="w-full py-2.5 rounded-lg text-black bg-yellow-400 hover:bg-yellow-500">Save</button>
            </div>
          </div>
        </form>

        {/* Projects */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Project</h2>
              <p className="text-gray-500">All-inclusive vacations and flights to the Caribbean</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>router.push('/projects/new')} className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium py-2 px-3 rounded-lg hover:bg-blue-700">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Add Project
              </button>
              <button className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-50">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 10h10M10 16h4"/></svg>
                Filter
              </button>
            </div>
          </div>
          {/* Search below header, full width */}
          <div className="relative mb-4">
            <input type="text" placeholder="Search client name, project name, company..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-400" />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {projects.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Grade Project {p.grade}</span>
                </div>
                <h3 className="font-bold text-lg mt-2">{p.name}</h3>
                <p className="text-sm text-gray-600">{clients.find(c=>c.id===p.clientId)?.company || ''}</p>
                <p className="text-sm text-gray-500 mt-1">{p.analyst}</p>
                <button onClick={()=>router.push(`/projects/${p.id}`)} className="mt-4 w-full text-blue-600 font-semibold text-sm flex items-center justify-center">
                  Details
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6 space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
          </div>
        </div>

        {/* Recent Clients */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Recent Clients</h2>
              <p className="text-gray-500">All-inclusive vacations and flights to the Caribbean</p>
            </div>
          </div>
          <div className="relative mb-4">
            <input type="text" placeholder="Search client name, project name, company..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-400" />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Date In</th>
                  <th className="px-6 py-3">PIC Name</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {date:'12 Jan 2023', pic:'Farid Nurhakim', position:'Business Analyst', company:'AXA Mandiri Finance Service', location:'Jakarta', category:'A'},
                  {date:'10 Jan 2023', pic:'Budi', position:'CTO', company:'Test Co', location:'Bandung', category:'B'},
                  {date:'08 Jan 2023', pic:'Sari', position:'Product Manager', company:'Acme Corp', location:'Surabaya', category:'A'},
                  {date:'05 Jan 2023', pic:'Andi', position:'Founder', company:'Startup XYZ', location:'Jakarta', category:'C'},
                ].map((client, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-6 py-4">{client.date}</td>
                    <td className="px-6 py-4 font-semibold">{client.pic}</td>
                    <td className="px-6 py-4">{client.position}</td>
                    <td className="px-6 py-4">{client.company}</td>
                    <td className="px-6 py-4">{client.location}</td>
                    <td className="px-6 py-4">{client.category}</td>
                    <td className="px-6 py-4"><button className="text-yellow-500 hover:text-yellow-600 p-1" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"/></svg>
                    </button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Confirmation modal */}
      {showConfirm && newClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Client Confirmation</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Company</span><span className="font-semibold">{newClient.company}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-semibold">{newClient.location}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Badan Usaha</span><span className="font-semibold">{newClient.badanUsaha}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">PIC Name</span><span className="font-semibold">{newClient.picName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Position</span><span className="font-semibold">{newClient.position}</span></div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={()=>setShowConfirm(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
              <button onClick={confirmAndAddProject} className="px-4 py-2 rounded bg-blue-600 text-white">Confirm & Add Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
