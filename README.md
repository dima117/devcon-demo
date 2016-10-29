# devcon-demo

Формат данных бэкенда:
```json
[
  {
    "Id":"d711d445-ea29-4e85-b1a4-bbaa2bd8a1c5",
    "Text":"Купить молоко",
    "Done":false
  },
  {
    "Id":"2a7b689c-659a-4b95-9687-9aa69206a34f",
    "Text":"Погулять с собакой",
    "Done":false
  }
]
```

Ручки:
- добавить: <http://todo.ecm7.ru/Home/Add?text=Посмотреть%20телевизор>
- изменнить состояние: <http://todo.ecm7.ru/Home/SetState/71e36598-b623-44b5-8b81-4adc9c26b72e?done=true>
- удалить: <http://todo.ecm7.ru/Home/Delete/71e36598-b623-44b5-8b81-4adc9c26b72e>

