export const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
}

export const formatDateTime = (date) => {
    return new Date(date).toLocaleString('fr-FR')
}