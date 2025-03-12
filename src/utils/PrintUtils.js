// Print functionality for flashcards

/**
 * Print double-sided cards (both fronts and backs)
 * @param {Array} cards - The flashcards to print
 * @param {string} title - Optional title for the print
 */
export const printDoubleSidedCards = (cards, title = 'Flashcards') => {
  const printContainer = document.createElement("div");
  printContainer.id = "print-container";

  // Group cards into pairs for printing (2 cards per page)
  for (let i = 0; i < cards.length; i += 2) {
    // Create front page
    const frontPage = document.createElement("div");
    frontPage.className = "print-page";
    frontPage.innerHTML = `
      <div class="print-header">
        <h1>${title} - Card Fronts (Page ${Math.ceil((i + 1) / 2)})</h1>
      </div>
      <div class="print-body">
        <div class="print-card">
          <div class="print-card-content">
            ${cards[i]?.front || cards[i]?.question || ''}
          </div>
        </div>
        ${i + 1 < cards.length ? `
          <div class="print-card">
            <div class="print-card-content">
              ${cards[i + 1]?.front || cards[i + 1]?.question || ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Create back page
    const backPage = document.createElement("div");
    backPage.className = "print-page";
    backPage.innerHTML = `
      <div class="print-header">
        <h1>${title} - Card Backs (Page ${Math.ceil((i + 1) / 2)})</h1>
      </div>
      <div class="print-body">
        <div class="print-card">
          <div class="print-card-content">
            ${cards[i]?.back || ''}
          </div>
        </div>
        ${i + 1 < cards.length ? `
          <div class="print-card">
            <div class="print-card-content">
              ${cards[i + 1]?.back || ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    printContainer.appendChild(frontPage);
    printContainer.appendChild(backPage);
  }

  // Open print window
  const printWindow = window.open("", "PrintDoubleSided", "width=1200,height=800");
  printWindow.document.write(`
    <html>
    <head>
      <title>Print Double-Sided Flashcards</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .print-page {
          page-break-after: always;
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          box-sizing: border-box;
        }
        .print-header {
          text-align: center;
          margin-bottom: 10mm;
        }
        .print-body {
          display: flex;
          flex-direction: column;
          gap: 10mm;
          height: calc(100% - 20mm);
        }
        .print-card {
          border: 1px solid #ccc;
          border-radius: 5mm;
          height: calc(50% - 5mm);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 5mm;
          box-sizing: border-box;
        }
        .print-card-content {
          width: 100%;
          text-align: center;
          font-size: 16pt;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .print-page {
            margin: 0;
            border: initial;
            border-radius: initial;
            width: initial;
            min-height: initial;
            box-shadow: initial;
            background: initial;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      ${printContainer.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

/**
 * Print only the fronts of cards
 * @param {Array} cards - The flashcards to print
 * @param {string} title - Optional title for the print
 */
export const printCardFronts = (cards, title = 'Flashcards') => {
  const printContainer = document.createElement("div");
  printContainer.id = "print-container-fronts";

  // Group cards into pairs for printing (2 cards per page)
  for (let i = 0; i < cards.length; i += 2) {
    // Create front page
    const frontPage = document.createElement("div");
    frontPage.className = "print-page";
    frontPage.innerHTML = `
      <div class="print-header">
        <h1>${title} - Card Fronts (Page ${Math.ceil((i + 1) / 2)})</h1>
      </div>
      <div class="print-body">
        <div class="print-card">
          <div class="print-card-content">
            ${cards[i]?.front || cards[i]?.question || ''}
          </div>
        </div>
        ${i + 1 < cards.length ? `
          <div class="print-card">
            <div class="print-card-content">
              ${cards[i + 1]?.front || cards[i + 1]?.question || ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    printContainer.appendChild(frontPage);
  }

  // Open print window
  const printWindow = window.open("", "PrintFronts", "width=1200,height=800");
  printWindow.document.write(`
    <html>
    <head>
      <title>Print Card Fronts</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .print-page {
          page-break-after: always;
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          box-sizing: border-box;
        }
        .print-header {
          text-align: center;
          margin-bottom: 10mm;
        }
        .print-body {
          display: flex;
          flex-direction: column;
          gap: 10mm;
          height: calc(100% - 20mm);
        }
        .print-card {
          border: 1px solid #ccc;
          border-radius: 5mm;
          height: calc(50% - 5mm);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 5mm;
          box-sizing: border-box;
        }
        .print-card-content {
          width: 100%;
          text-align: center;
          font-size: 16pt;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .print-page {
            margin: 0;
            border: initial;
            border-radius: initial;
            width: initial;
            min-height: initial;
            box-shadow: initial;
            background: initial;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      ${printContainer.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

/**
 * Print only the backs of cards
 * @param {Array} cards - The flashcards to print
 * @param {string} title - Optional title for the print
 */
export const printCardBacks = (cards, title = 'Flashcards') => {
  const printContainer = document.createElement("div");
  printContainer.id = "print-container-backs";

  // Group cards into pairs for printing (2 cards per page)
  for (let i = 0; i < cards.length; i += 2) {
    // Create back page
    const backPage = document.createElement("div");
    backPage.className = "print-page back";
    backPage.innerHTML = `
      <div class="print-header">
        <h1>${title} - Card Backs (Page ${Math.ceil((i + 1) / 2)})</h1>
      </div>
      <div class="print-body">
        <div class="print-card">
          <div class="print-card-content">
            ${cards[i]?.back || ''}
          </div>
        </div>
        ${i + 1 < cards.length ? `
          <div class="print-card">
            <div class="print-card-content">
              ${cards[i + 1]?.back || ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    printContainer.appendChild(backPage);
  }

  // Open print window
  const printWindow = window.open("", "PrintBacks", "width=1200,height=800");
  printWindow.document.write(`
    <html>
    <head>
      <title>Print Card Backs</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .print-page {
          page-break-after: always;
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          box-sizing: border-box;
        }
        .print-page.back {
          background-color: #f9f9f9;
        }
        .print-header {
          text-align: center;
          margin-bottom: 10mm;
        }
        .print-body {
          display: flex;
          flex-direction: column;
          gap: 10mm;
          height: calc(100% - 20mm);
        }
        .print-card {
          border: 1px solid #ccc;
          border-radius: 5mm;
          height: calc(50% - 5mm);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 5mm;
          box-sizing: border-box;
          background-color: white;
        }
        .print-card-content {
          width: 100%;
          text-align: center;
          font-size: 16pt;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .print-page {
            margin: 0;
            border: initial;
            border-radius: initial;
            width: initial;
            min-height: initial;
            box-shadow: initial;
            background: initial;
            page-break-after: always;
          }
        }
      </style>
    </head>
    <body>
      ${printContainer.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}; 