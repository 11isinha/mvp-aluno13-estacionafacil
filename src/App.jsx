import React, { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from './lib/supabase';
import {
  Car,
  MapPin,
  Plus,
  RefreshCw,
  LogOut,
  Navigation,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function App() {
  // Estados de Autenticação e Navegação (Jornada de 3 Telas)
  const [session, setSession] = useState(null);
  const [telaAtiva, setTelaAtiva] = useState('feed'); // 'feed' (Tela 02) | 'novo' (Tela 03)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Estados do CRUD (vagas_livres) e Hardware Nativo (GPS)
  const [vagas, setVagas] = useState([]);
  const [referencia, setReferencia] = useState('');
  const [tipoVaga, setTipoVaga] = useState('Rua Pública');
  const [coords, setCoords] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [buscandoGps, setBuscandoGps] = useState(false);

  // Monitora sessão no Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) carregarVagas();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) carregarVagas();
    });

    return () => subscription.unsubscribe();
  }, []);

  // READ: Busca vagas livres ordenadas pelas mais recentes
  async function carregarVagas() {
    setCarregando(true);
    const { data, error } = await supabase
      .from('vagas_livres')
      .select('*')
      .order('criado_em', { ascending: false });

    if (!error && data) {
      setVagas(data);
    }
    setCarregando(false);
  }

  // TELA 01: Login / Cadastro Rápido
  async function handleLogin(e) {
    e.preventDefault();
    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setMensagem({ tipo: 'erro', texto: 'Erro ao autenticar: ' + signUpError.message });
      } else {
        setMensagem({ tipo: 'sucesso', texto: 'Conta criada! Se não entrar automaticamente, clique em Entrar novamente.' });
      }
    }
    setCarregando(false);
  }

  // HARDWARE NATIVO: Capturar GPS (@capacitor/geolocation)
  async function capturarLocalizacaoGPS() {
    setBuscandoGps(true);
    setMensagem({ tipo: '', texto: '' });
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      setCoords({
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6)
      });
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: 'Não foi possível obter o GPS. Verifique se a localização está ativada.'
      });
    }
    setBuscandoGps(false);
  }

  // CREATE: Salvar nova vaga livre no Supabase
  async function salvarVaga(e) {
    e.preventDefault();
    if (!referencia.trim()) {
      return setMensagem({ tipo: 'erro', texto: 'Informe um ponto de referência da vaga.' });
    }

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    const { error } = await supabase.from('vagas_livres').insert([{
      user_id: session.user.id,
      referencia,
      tipo_vaga: tipoVaga,
      latitude: coords ? parseFloat(coords.lat) : null,
      longitude: coords ? parseFloat(coords.lng) : null
    }]);

    if (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro ao publicar vaga: ' + error.message });
    } else {
      setReferencia('');
      setTipoVaga('Rua Pública');
      setCoords(null);
      setTelaAtiva('feed');
      carregarVagas();
    }
    setCarregando(false);
  }

  // DELETE: Remover vaga quando ocupada ou sinalizada pelo próprio autor
  async function removerVaga(id) {
    await supabase.from('vagas_livres').delete().eq('id', id);
    carregarVagas();
  }

  // Formata horário amigável
  function formatarHora(isoString) {
    if (!isoString) return '';
    const data = new Date(isoString);
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  // ==========================================
  // TELA 01: LOGIN / CADASTRO
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-6 relative overflow-hidden">
        {/* Detalhe visual de fundo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-sm w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
            <Car className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="inline-block px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-mono text-[10px] font-bold tracking-wider uppercase mb-2">
            MVP • Aluno 13
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">EstacionaFácil</h1>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Encontre e sinalize vagas livres em tempo real via GPS.
          </p>

          {mensagem.texto && (
            <div className={`mb-4 p-3.5 rounded-2xl border text-xs font-medium flex items-start gap-2.5 ${
              mensagem.tipo === 'erro'
                ? 'bg-red-950/60 border-red-800 text-red-300'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{mensagem.texto}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                placeholder="motorista@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-sm hover:bg-emerald-400 active:scale-[0.99] transition shadow-lg shadow-emerald-500/20"
            >
              {carregando ? 'Conectando...' : 'Entrar / Criar Conta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // APLICATIVO AUTENTICADO (TELA 02 & TELA 03)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 pb-28 flex flex-col">
      {/* Cabeçalho Fixo */}
      <header className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center">
            <Car className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight leading-none">EstacionaFácil</h1>
            <p className="text-[11px] font-mono text-slate-400 mt-1 truncate max-w-[180px]">
              {session.user.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut()}
          className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-red-600 hover:text-white transition flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        {telaAtiva === 'feed' ? (
          /* ==========================================
             TELA 02: VAGAS SINALIZADAS AGORA (FEED)
             ========================================== */
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Vagas Sinalizadas Agora
                </h2>
                <p className="text-xs text-slate-500">
                  {vagas.length} {vagas.length === 1 ? 'vaga disponível' : 'vagas disponíveis'} na região
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Ao vivo
              </span>
            </div>

            {vagas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm mt-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Nenhuma vaga sinalizada ainda</p>
                <p className="text-xs text-slate-500 mt-1">
                  Viu uma vaga livre? Toque no botão verde <strong className="text-emerald-600">+</strong> abaixo para ajudar outros motoristas.
                </p>
              </div>
            ) : (
              vagas.map((vaga) => (
                <div
                  key={vaga.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-emerald-400">
                      {vaga.tipo_vaga}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatarHora(vaga.criado_em)}
                      </span>

                      {vaga.user_id === session.user.id && (
                        <button
                          onClick={() => removerVaga(vaga.id)}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg"
                          title="Remover vaga"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Ocupada
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {vaga.referencia}
                    </h3>
                  </div>

                  {vaga.latitude && vaga.longitude ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        {vaga.latitude}, {vaga.longitude}
                      </span>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${vaga.latitude},${vaga.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-xl"
                      >
                        Abrir Mapa
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Coordenadas GPS não anexadas
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* ==========================================
             TELA 03: MARCAR VAGA LIVRE COM GPS
             ========================================== */
          <form onSubmit={salvarVaga} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Ação Nativa • GPS
              </span>
              <h2 className="font-black text-slate-900 text-lg mt-1">Marcar Vaga Livre</h2>
              <p className="text-xs text-slate-500">
                Informe onde está a vaga e capture sua localização exata.
              </p>
            </div>

            {mensagem.texto && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mensagem.texto}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ponto de Referência *
              </label>
              <input
                type="text"
                placeholder="Ex: Em frente ao portão 2 da escola..."
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tipo de Vaga
              </label>
              <select
                value={tipoVaga}
                onChange={(e) => setTipoVaga(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Rua Pública">Rua Pública</option>
                <option value="Zona Azul / Rotativo">Zona Azul / Rotativo</option>
                <option value="Estacionamento Instituição">Estacionamento Instituição</option>
                <option value="Vaga Rápida (15 min)">Vaga Rápida (15 min)</option>
              </select>
            </div>

            {/* Botão Hardware Nativo GPS */}
            <div className="pt-1">
              <button
                type="button"
                onClick={capturarLocalizacaoGPS}
                disabled={buscandoGps}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition border ${
                  coords
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {coords ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    GPS Capturado ({coords.lat}, {coords.lng})
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {buscandoGps ? 'Obtendo satélites GPS...' : 'Capturar Localização GPS Atual'}
                  </>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              {carregando ? 'Publicando Vaga...' : 'Sinalizar Vaga no Feed'}
            </button>
          </form>
        )}
      </main>

      {/* Navegação Inferior (Ergonomia do Polegar / Thumb Zone) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-6 flex items-center justify-around z-20">
        <button
          onClick={() => setTelaAtiva('feed')}
          className={`flex flex-col items-center gap-1 text-xs font-bold py-1 px-4 rounded-xl transition ${
            telaAtiva === 'feed' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Car className="w-5 h-5" />
          <span>Vagas</span>
        </button>

        <button
          onClick={() => {
            setMensagem({ tipo: '', texto: '' });
            setTelaAtiva('novo');
          }}
          className="w-14 h-14 -mt-8 rounded-full bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/30 border-4 border-slate-100 flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition"
          aria-label="Marcar Vaga Livre"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>

        <button
          onClick={carregarVagas}
          className="flex flex-col items-center gap-1 text-xs font-bold py-1 px-4 rounded-xl text-slate-400 hover:text-slate-600 transition"
        >
          <RefreshCw className={`w-5 h-5 ${carregando ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Atualizar</span>
        </button>
      </nav>
    </div>
  );
}