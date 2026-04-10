window.export_elk = async function() {
    const scrollContainer = document.querySelector('.euiDataGrid__virtualized');
    
    if (!scrollContainer) {
        console.error("Контейнер таблицы не найден. Убедись, что таблица загружена.");
        return;
    }

    const allLogs = new Map();
    let previousScrollTop = -1;
    let unchangedScrollCount = 0;

    // Создаем плашку-индикатор статуса
    let statusDiv = document.getElementById('elk-export-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'elk-export-status';
        statusDiv.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:9999; background:#222; color:#0f0; padding:10px 15px; border-radius:4px; font-family:monospace; font-size:14px; box-shadow: 0 2px 10px rgba(0,0,0,0.5);";
        document.body.appendChild(statusDiv);
    }
    statusDiv.style.display = 'block';
    statusDiv.innerText = "Инициализация...";

    console.log("Начинаю сбор логов... Не трогай скролл на странице.");

    scrollContainer.scrollTop = 0;
    await new Promise(r => setTimeout(r, 1000));

    while (true) {
        const rows = document.querySelectorAll('.euiDataGridRow');

        rows.forEach(row => {
            const record = {};
            const dl = row.querySelector('dl.euiDescriptionList');
            
            if (dl) {
                const terms = dl.querySelectorAll('dt');
                terms.forEach(dt => {
                    const key = dt.innerText.trim();
                    const dd = dt.nextElementSibling;
                    record[key] = dd ? dd.innerText.trim() : "";
                });
                
                if (Object.keys(record).length > 0) {
                    const uniqueId = record['_id'] || JSON.stringify(record);
                    allLogs.set(uniqueId, record);
                }
            }
        });

        statusDiv.innerText = `Собрано уникальных строк: ${allLogs.size}...`;

        if (scrollContainer.scrollTop === previousScrollTop) {
            unchangedScrollCount++;
            if (unchangedScrollCount >= 3) {
                break; // Дошли до конца
            }
        } else {
            unchangedScrollCount = 0;
        }

        previousScrollTop = scrollContainer.scrollTop;
        scrollContainer.scrollTop += scrollContainer.clientHeight;
        
        await new Promise(r => setTimeout(r, 800)); 
    }

    statusDiv.innerText = `Сбор завершен. Подготовка файла...`;

    // Формируем JSON и скачиваем файл
    const data = Array.from(allLogs.values());
    const jsonResult = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonResult], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kibana_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(data);
    console.log(`Готово. Скачан файл с ${data.length} записями.`);

    statusDiv.innerText = `Готово! Скачано ${data.length} строк.`;
    setTimeout(() => { statusDiv.style.display = 'none'; }, 3000);
};

console.log("Функция загружена. Для запуска введи в консоли: export_elk()");