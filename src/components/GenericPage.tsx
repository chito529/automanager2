import React from 'react';

export default function GenericPage({ title, description }: { title: string, description: string }) {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-slate-200">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-8 bg-slate-900/50 shadow-sm border border-slate-800 sm:rounded-xl p-16 text-center">
        <h3 className="mt-2 text-sm font-semibold text-slate-200">Módulo en construcción</h3>
        <p className="mt-1 text-sm text-slate-400">Esta sección se conectará a Firestore próximamente.</p>
      </div>
    </div>
  );
}
