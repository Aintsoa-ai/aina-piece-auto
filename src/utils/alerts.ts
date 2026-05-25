import Swal from 'sweetalert2';

// Instance de base avec le design System (Glassmorphism Dark)
const swalTheme = Swal.mixin({
  background: '#161b22',
  color: '#ffffff',
  customClass: {
    popup: 'glass-panel border-opacity-10',
    confirmButton: 'swal2-confirm-custom',
    cancelButton: 'swal2-cancel-custom',
  },
  buttonsStyling: false, // On désactive le style par défaut pour utiliser nos classes
});

// Injection d'un peu de CSS global pour nos boutons custom (SweetAlert2 bypass)
const style = document.createElement('style');
style.innerHTML = `
  .swal2-confirm-custom {
    background-color: #0066fe !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 10px 20px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    margin: 0 5px !important;
    transition: background-color 0.2s !important;
  }
  .swal2-confirm-custom:hover {
    background-color: #005ce6 !important;
  }
  .swal2-cancel-custom {
    background-color: transparent !important;
    color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.2) !important;
    border-radius: 8px !important;
    padding: 10px 20px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    margin: 0 5px !important;
    transition: background-color 0.2s !important;
  }
  .swal2-cancel-custom:hover {
    background-color: rgba(255,255,255,0.05) !important;
  }
  .swal2-danger-custom {
    background-color: #ef4444 !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 10px 20px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    margin: 0 5px !important;
  }
`;
document.head.appendChild(style);

export const showAlert = (message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  return swalTheme.fire({
    text: message,
    icon: icon,
    confirmButtonText: 'OK',
  });
};

export const showConfirm = async (message: string, isDanger: boolean = false) => {
  const result = await swalTheme.fire({
    text: message,
    icon: isDanger ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonText: 'Oui, continuer',
    cancelButtonText: 'Annuler',
    customClass: {
      popup: 'glass-panel',
      confirmButton: isDanger ? 'swal2-danger-custom' : 'swal2-confirm-custom',
      cancelButton: 'swal2-cancel-custom',
    }
  });
  return result.isConfirmed;
};

export const showPrompt = async (message: string, defaultValue: string = '') => {
  const result = await swalTheme.fire({
    text: message,
    input: 'text',
    inputValue: defaultValue,
    showCancelButton: true,
    confirmButtonText: 'Valider',
    cancelButtonText: 'Annuler',
  });
  return result.value;
};
