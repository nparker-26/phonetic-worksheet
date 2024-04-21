import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import './App.css';

function RandomWords() {
  const [words, setWords] = useState([]);
  const [displayedWords, setDisplayedWords] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [ratings, setRatings] = useState({});
  const [wordCount, setWordCount] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/cmudict.csv');
      const data = await response.text();
      const wordList = parseCsv(data);
      setWords(wordList);

      const symbolsResponse = await fetch('/cmudict_symbols.csv');
      const symbolsData = await symbolsResponse.text();
      const symbolList = parseCsv(symbolsData);
      setSymbols(symbolList);
    };
    fetchData();
  }, []);

  const getRandomWords = (append = false) => {
    let filteredWords = words;
    if (selectedSymbol) {
      filteredWords = words.filter((row) => row[1] && row[1].includes(selectedSymbol));
    }
    const shuffledWords = [...filteredWords].sort(() => Math.random() - 0.5);
    const newDisplayedWords = shuffledWords.slice(0, wordCount);
    const uniqueNewDisplayedWords = newDisplayedWords.filter((word, index) => newDisplayedWords.indexOf(word) === index);

    if (append) {
      setDisplayedWords((prevDisplayedWords) => [...prevDisplayedWords, ...uniqueNewDisplayedWords]);
    } else {
      setDisplayedWords(uniqueNewDisplayedWords);
    }
  };

  const parseCsv = (data) => {
    const results = Papa.parse(data, { header: false });
    return results.data;
  };

  const handleDeleteWord = (wordToDelete) => {
    setDisplayedWords(displayedWords.filter((word) => word[0] !== wordToDelete));
    setRatings((prevRatings) => {
      const updatedRatings = { ...prevRatings };
      delete updatedRatings[wordToDelete];
      return updatedRatings;
    });
  };

  const handleDeleteAll = () => {
    setDisplayedWords([]);
    setRatings({});
  };

  const handleRatingChange = (word, rating) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [word]: rating,
    }));
  };

  const handleSubmit = () => {
    const doc = new jsPDF();
    const text = displayedWords
      .map((word) => `${word[0]}: ${ratings[word[0]] || 'N/A'}`)
      .join('\n');

    doc.text(text, 10, 10);
    doc.save('word_ratings.pdf');

    handleDeleteAll();
  };

  return (
    <div className="App">
      <h1>Phonetic Worksheet</h1>
      <div className="controls">
        <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
          <option value="">No Filter</option>
          {symbols.map((symbol) => (
            <option key={symbol[0]} value={symbol[0]}>
              {symbol[0]}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={wordCount}
          onChange={(e) => setWordCount(parseInt(e.target.value))}
          min="1"
        />
<button onClick={() => getRandomWords(true)}>Add Words</button>
        <button onClick={handleDeleteAll}>Delete All</button>
        <button onClick={handleSubmit}>Submit and Download</button>
      </div>
      <ul>
        {displayedWords.map((row) => (
          <li key={row[0]}>
            {row[0]}
            <div>
              <select
                className="rating-select"
                value={ratings[row[0]] || ''}
                onChange={(e) => handleRatingChange(row[0], e.target.value)}
              >
                <option value="">Rate</option>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
              <button className="delete-button" onClick={() => handleDeleteWord(row[0])}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RandomWords;