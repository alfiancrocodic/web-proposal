"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';

const PLATFORMS = [
  "Android Phone",
  "Android Tablet",
  "iOS iPhone",
  "iOS iPad",
  "Web Backend",
  "Web Frontend",
];

const PLATFORM_COLORS = {
  'Android Phone': 'bg-green-100 text-green-800',
  'Android Tablet': 'bg-emerald-100 text-emerald-800',
  'iOS iPhone': 'bg-gray-200 text-gray-800',
  'iOS iPad': 'bg-slate-200 text-slate-800',
  'Web Backend': 'bg-blue-100 text-blue-800',
  'Web Frontend': 'bg-cyan-100 text-cyan-800',
};

export default function NewProjectPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ clientId: '', name: '', analyst: '', grade: 'A', roles: [] });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [editRoleIndex, setEditRoleIndex] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('auth')) router.replace('/login');
    fetch('/api/clients').then(r=>r.json()).then(data => {
      setClients(data);
      const cid = sp.get('clientId');
      setForm(f => ({ ...f, clientId: cid || (data[0]?.id || '') }));
    });
  }, [router, sp]);

  const toggleRole = () => {};
  const removeRole = (index) => setForm(f => ({ ...f, roles: f.roles.filter((_, i)=>i!==index) }));
  const removePlatform = (roleIdx, platform) => setForm(f=>({ ...f, roles: f.roles.map((r,i)=> i!==roleIdx ? r : { ...r, platforms: r.platforms.filter(p=>p!==platform) }) }));
  const openAddRole = () => { setEditRoleIndex(null); setRoleName(''); setSelectedPlatforms([]); setShowRoleModal(true); };
  const openAddPlatform = (idx) => { setEditRoleIndex(idx); setRoleName(form.roles[idx]?.name || ''); setSelectedPlatforms([]); setShowRoleModal(true); };
  const toggleSelectPlatform = (p) => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev, p]);
  const saveRoleModal = () => {
    if (editRoleIndex === null) {
      if (!roleName.trim() || selectedPlatforms.length === 0) return;
      setForm(f => ({ ...f, roles: [...(f.roles||[]), { name: roleName.trim(), platforms: selectedPlatforms }] }));
    } else {
      if (selectedPlatforms.length === 0) { setShowRoleModal(false); return; }
      setForm(f => ({ ...f, roles: f.roles.map((r,i)=> i!==editRoleIndex ? r : { ...r, platforms: Array.from(new Set([...(r.platforms||[]), ...selectedPlatforms])) }) }));
    }
    setRoleName(''); setSelectedPlatforms([]); setEditRoleIndex(null); setShowRoleModal(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const p = await res.json();
    if (res.ok) router.push(`/projects/${p.id}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Breadcrumbs crumbs={["Home","Project","Add/Edit Project"]} />
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add/Edit Project</h1>
            <p className="mt-1 text-sm text-gray-500">All-inclusive vacations and flights to the Caribbean</p>
          </div>
          <button onClick={submit} className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700">Save Project</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Project Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Analyst</label>
                <div className="relative mt-1">
                  <select value={form.analyst} onChange={e=>setForm({...form, analyst:e.target.value})} className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 appearance-none">
                    {['','Mas Adit','Analyst A','Analyst B'].map(a => <option key={a} value={a}>{a || 'Select analyst'}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Company Name</label>
                <select value={form.clientId} onChange={e=>setForm({...form, clientId:e.target.value})} className="mt-1 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5">
                  {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">PIC Name</label>
                <input value={clients.find(c=>c.id===form.clientId)?.picName || ''} disabled className="mt-1 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Project Name</label>
                <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="mt-1 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5" placeholder="Project name" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Select Project Grade</label>
                <div className="flex items-center space-x-6 mt-2">
                  {['A','B','C'].map(g => (
                    <label key={g} className="flex items-center">
                      <input type="radio" name="grade" value={g} checked={form.grade===g} onChange={e=>setForm({...form, grade:e.target.value})} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User Role */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">User Role</h2>
              <button type="button" onClick={openAddRole} className="text-sm bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Add Role
              </button>
            </div>
            <div className="space-y-4">
              {(form.roles || []).map((r, idx) => (
                <div key={`${r.name}-${idx}`} className="">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gray-200 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-2">
                      {r.name}
                      <button type="button" onClick={()=>removeRole(idx)} title="Remove role" className="text-gray-500 hover:text-gray-700">
                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.platforms?.map(p => (
                      <span key={p} className={`${PLATFORM_COLORS[p] || 'bg-gray-100 text-gray-800'} text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-2`}>
                        {p}
                        <button type="button" onClick={()=>removePlatform(idx, p)} title="Remove platform" className="text-gray-500 hover:text-gray-700">
                          <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </span>
                    ))}
                    <button type="button" onClick={()=>openAddPlatform(idx)} className="px-2 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50">+ Platform</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Add Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">{editRoleIndex === null ? 'Add Role' : 'Add Platform'}</h2>
            <div className="space-y-4">
              {editRoleIndex === null && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role Name</label>
                  <input value={roleName} onChange={e=>setRoleName(e.target.value)} placeholder="Sales" className="mt-1 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => {
                    const active = selectedPlatforms.includes(p);
                    return (
                      <button type="button" key={p} onClick={()=>toggleSelectPlatform(p)} className={`px-3 py-1 text-sm border rounded-full ${active ? 'bg-blue-50 border-blue-400 text-blue-700' : 'hover:bg-gray-100 border-gray-300'}`}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={()=>{ setShowRoleModal(false); setRoleName(''); setSelectedPlatforms([]); setEditRoleIndex(null); }} className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300">Cancel</button>
              <button onClick={saveRoleModal} className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
