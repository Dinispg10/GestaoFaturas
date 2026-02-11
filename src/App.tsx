import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Router } from "./components/Router";
import TitleBar from "./components/TitleBar";
import "./styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TitleBar title="Farmácia Pinto" />
        <Router />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
