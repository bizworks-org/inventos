import AppRouter from "./components/AppRouter";
import { PrefsProvider } from "./components/assetflow/layout/PrefsContext";

export default function App() {
  return (
    <PrefsProvider>
      <AppRouter />
    </PrefsProvider>
  );
}