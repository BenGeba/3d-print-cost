import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    function onBIP(e) {
      e.preventDefault();      // Browser-UI unterdrücken
      setDeferred(e);          // Event für späteres prompt() merken
    }
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();   // zeigt Install-Prompt
    setDeferred(null);         // Event ist nur 1× nutzbar
  }

  if (!deferred) return null;  // Button nur anzeigen, wenn installierbar
  return <button className="btn btn-primary" onClick={install}>App installieren</button>;
}
