export function formatDate(dateString) {
    try {
      if (!dateString || dateString === "0" || dateString === 0) return "-";
      const date = new Date(dateString);
      if (isNaN(date.getTime()) || date.getTime() === 0) return "-";
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '-';
    }
  }
 