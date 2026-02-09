import { jsPDF } from 'jspdf';
import { ChatSession } from '../types';

/**
 * Exporte une session de chat au format JSON
 */
export const exportToJSON = (session: ChatSession) => {
    const dataStr = JSON.stringify(session, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `conversation-${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

/**
 * Exporte une session de chat au format TXT
 */
export const exportToTXT = (session: ChatSession) => {
    let content = `CONVERSATION: ${session.title}\n`;
    content += `Date: ${new Date(session.createdAt).toLocaleString()}\n`;
    content += `-------------------------------------------\n\n`;

    session.messages.forEach((msg) => {
        const role = msg.role === 'user' ? 'VOUS' : msg.role === 'model' ? 'NEUROCHAT' : 'SYSTÈME';
        content += `[${new Date(msg.timestamp).toLocaleTimeString()}] ${role}:\n${msg.content}\n\n`;
    });

    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    const exportFileDefaultName = `conversation-${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

/**
 * Exporte une session de chat au format PDF
 */
export const exportToPDF = (session: ChatSession) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Titre
    doc.setFontSize(22);
    doc.setTextColor(63, 81, 181); // Indigo
    doc.text('NeuroChat Pro', margin, 20);

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Conversation: ${session.title}`, margin, 32);

    doc.setFontSize(10);
    doc.text(`Date: ${new Date(session.createdAt).toLocaleString()}`, margin, 38);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 42, pageWidth - margin, 42);

    let y = 52;

    doc.setFontSize(11);

    session.messages.forEach((msg) => {
        const role = msg.role === 'user' ? 'VOUS' : msg.role === 'model' ? 'NEUROCHAT' : 'SYSTÈME';
        const time = new Date(msg.timestamp).toLocaleTimeString();

        // Vérifier l'espace restant
        if (y > 270) {
            doc.addPage();
            y = 20;
        }

        // Rôle et heure
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(msg.role === 'user' ? 63 : 0, msg.role === 'user' ? 81 : 150, msg.role === 'user' ? 181 : 136);
        doc.text(`${role} (${time})`, margin, y);
        y += 6;

        // Contenu
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 30);

        const lines = doc.splitTextToSize(msg.content, contentWidth);
        doc.text(lines, margin, y);
        y += (lines.length * 6) + 10;
    });

    doc.save(`conversation-${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
};
