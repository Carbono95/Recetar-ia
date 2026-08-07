// Notificador desacoplado de la plataforma. Los hooks del core solo llaman notify();
// cada plataforma configura la implementación real (web: window.alert; móvil: Alert.alert)
// una vez al arrancar. Así los hooks se pueden compartir sin referenciar APIs de UI.
let notifier = (message) => {
  console.warn("notify() llamado sin configurar. Mensaje:", message);
};

export function setNotifier(fn) {
  notifier = fn;
}

export function notify(message) {
  notifier(message);
}
