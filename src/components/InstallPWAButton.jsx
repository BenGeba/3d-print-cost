import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    function onBIP(e) {
      e.preventDefault();
      setDeferred(e);
    }
    window.addEventListener("beforeinstallprompt", onBIP);
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    setDeferred(null);
  }

  if (!deferred) return null;
  return <button className="btn btn-primary" onClick={install}>App installieren</button>;
}
