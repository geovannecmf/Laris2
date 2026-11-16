import { lazy, Suspense, Component, type ReactNode } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AppProvider } from './components/AppState';
import { Layout } from './components/Layout';
import { Loading } from './components/ui';
import Home from './modules/Home';

const Paint = lazy(() => import('./modules/Paint'));
const NewZealand = lazy(() => import('./modules/NewZealand'));
const Cinema = lazy(() => import('./modules/Cinema'));
const Curitiba = lazy(() => import('./modules/Curitiba'));
const Watch = lazy(() => import('./modules/Watch'));
const Arcade = lazy(() => import('./modules/Arcade'));
const Extras = lazy(() => import('./modules/Extras'));

class Boundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() {
    if (this.state.err) return (
      <div className="chip mx-auto mt-10 max-w-md p-6 text-center">
        <h1 className="font-display text-2xl font-bold">Esta tela tropeçou.</h1>
        <p className="mt-2 text-muted">O resto do app continua funcionando. Recarregue a página ou volte para o início.</p>
        <div className="mt-4 flex justify-center gap-2">
          <button className="btn-primary" onClick={() => location.reload()}>Recarregar</button>
          <a className="btn-outline" href="/">Início</a>
        </div>
      </div>
    );
    return this.props.children;
  }
}

function NotFound() {
  return (
    <div className="chip mx-auto mt-10 max-w-md p-6 text-center">
      <h1 className="font-display text-3xl font-extrabold">Página entediada demais para existir.</h1>
      <p className="mt-2 text-muted">O endereço não leva a lugar nenhum.</p>
      <Link className="btn-primary mt-4" to="/">Voltar ao início</Link>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Boundary>
          <Suspense fallback={<Loading label="Abrindo módulo…" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pintar" element={<Paint />} />
              <Route path="/nova-zelandia" element={<NewZealand />} />
              <Route path="/cinema" element={<Cinema />} />
              <Route path="/curitiba" element={<Curitiba />} />
              <Route path="/assistir" element={<Watch />} />
              <Route path="/arcade" element={<Arcade />} />
              <Route path="/arcade/:game" element={<Arcade />} />
              <Route path="/extras" element={<Extras />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Boundary>
      </Layout>
    </AppProvider>
  );
}
