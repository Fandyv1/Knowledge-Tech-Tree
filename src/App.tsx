import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TreePage from './pages/TreePage';
import NodeDetailPage from './pages/NodeDetailPage';
import NotFound from './components/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tree/:goalId" element={<TreePage />} />
      <Route path="/tree/:goalId/node/:nodeId" element={<NodeDetailPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
