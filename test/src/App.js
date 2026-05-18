import React, { useState } from 'react';
import Converter from 'convert-units';

const App = () => {
  const [type, setType] = useState('length');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);

  const convert = () => {
    const converter = Converter(type);
    setResult(converter.from(value).to(toUnit));
  };

  return (
    <div>
      <h1>Конвертер единиц</h1>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="length">Длина</option>
        <option value="volume">Объем</option>
        <option value="weight">Вес</option>
      </select>

      <div>
        <label>Из: {fromUnit}</label>
        <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
          <option value="">Выберите единицу</option>
          <option value="m">Метр</option>
          <option value="km">Километр</option>
          <option value="cm">Сантиметр</option>
        </select>
      </div>

      <div>
        <label>В: {toUnit}</label>
        <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
          <option value="">Выберите единицу</option>
          <option value="m">Метр</option>
          <option value="km">Километр</option>
          <option value="cm">Сантиметр</option>
        </select>
      </div>

      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <button onClick={convert}>Конвертировать</button>

      {result && <div>Результат: {result}</div>}
    </div>
  );
};

export default App;