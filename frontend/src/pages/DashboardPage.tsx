import { useDashboardPage, type TabId } from '../hooks/useDashboardPage';
import { PerfilHeader } from '../components/dashboardEmpleado/PerfilHeader';
import { SaldoVacaciones } from '../components/dashboardEmpleado/SaldoVacaciones';
import { NuevaSolicitud } from '../components/dashboardEmpleado/NuevaSolicitud';
import { MisSolicitudes } from '../components/dashboardEmpleado/MisSolicitudes';

const TABS: { id: TabId; label: string }[] = [
  { id: 'informacion', label: 'Información' },
  { id: 'nueva', label: 'Nueva solicitud' },
  { id: 'mis', label: 'Mis solicitudes' },
];

export function DashboardPage() {
  const {
    tabActivo, setTabActivo,
    perfil, cargandoPerfil, errorPerfil,
    solicitudes, cargandoLista, errorLista,
    diasSeleccionados, setDiasSeleccionados,
    errorForm, exitoForm, enviando,
    manejarCrear, finDeMesSeleccionados,
  } = useDashboardPage();

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-lg border border-gray-100 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActivo(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              tabActivo === tab.id
                ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabActivo === 'informacion' && (
        <div className='spcae-y-6 transition-opacity duration-300 starting:opacity-0'>
            <PerfilHeader perfil={perfil} cargando={cargandoPerfil} error={errorPerfil} />
            <SaldoVacaciones perfil={perfil} />
        </div>
      )}

      {tabActivo === 'nueva' && (
      <div className='spcae-y-6 transition-opacity duration-300 starting:opacity-0'>
        <NuevaSolicitud
          perfil={perfil}
          diasSeleccionados={diasSeleccionados}
          onCambiarDias={setDiasSeleccionados}
          finDeMesSeleccionados={finDeMesSeleccionados}
          errorForm={errorForm}
          exitoForm={exitoForm}
          enviando={enviando}
          onCrear={manejarCrear}
        />
      </div>
      )}

      {tabActivo === 'mis' && (
        <MisSolicitudes solicitudes={solicitudes} cargando={cargandoLista} error={errorLista} />
      )}
    </div>
  );
}