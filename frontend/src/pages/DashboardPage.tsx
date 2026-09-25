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

      <div className="w-full md:w-fit p-1">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-gray-100 w-full md:w-auto">
          {TABS.map((tab) => {
            const isActive = tabActivo === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabActivo(tab.id)}
                className={`flex-1 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ease-out active:scale-95 select-none text-center ${
                  isActive
                    ? 'bg-linear-to-r from-[#4a8b2c] to-[#ee7624] text-white shadow-lg shadow-[#4a8b2c]/25 scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
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