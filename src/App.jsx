import { ErrorBoundary } from './pages/ErrorBoundary';
import Home from './pages/Home';

function App() {
  return (
    <ErrorBoundary>
      <Home />
      
    </ErrorBoundary>
  );
}

export default App;
