(async function() {
    // Находим контейнер, который отвечает за скролл в таблице Kibana
    const scrollContainer = document.querySelector('.euiDataGrid__virtualized');
    
    if (!scrollContainer) {
        console.error("Контейнер таблицы не найден. Убедись, что таблица загружена.");
        return;
    }

    const allLogs = new Map();
    let previousScrollTop = -1;
    let unchangedScrollCount = 0;

    console.log("Начинаю сбор логов... Не трогай скролл на странице.");

    // Возвращаемся в самое начало перед стартом
    scrollContainer.scrollTop = 0;
    await new Promise(r => setTimeout(r, 1000));

    while (true) {
        // Собираем текущие видимые строки
        const rows = document.querySelectorAll('.euiDataGridRow');
        let parsedInThisTick = 0;

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
                    // Используем _id для дедупликации строк при скролле
                    const uniqueId = record['_id'] || JSON.stringify(record);
                    allLogs.set(uniqueId, record);
                    parsedInThisTick++;
                }
            }
        });

        // Проверяем, сдвинулся ли скролл с прошлого шага
        if (scrollContainer.scrollTop === previousScrollTop) {
            unchangedScrollCount++;
            // Если скролл не меняется 3 итерации подряд — мы достигли конца
            if (unchangedScrollCount >= 3) {
                break;
            }
        } else {
            unchangedScrollCount = 0;
        }

        previousScrollTop = scrollContainer.scrollTop;

        // Прокручиваем вниз на высоту видимой области
        scrollContainer.scrollTop += scrollContainer.clientHeight;
        
        // Ждем пока Kibana отрендерит новые строки в DOM. 
        // Если интернет или ПК медленные, увеличь задержку.
        await new Promise(r => setTimeout(r, 800)); 
    }

    const data = Array.from(allLogs.values());
    const jsonResult = JSON.stringify(data, null, 2);
    
    console.log(data);
    copy(jsonResult);
    
    console.log(`Готово. Собрано уникальных логов: ${data.length}. JSON скопирован в буфер обмена.`);
})();