const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const dbFile = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbData = {};
let nextId = {};

function loadDB() {
  if (fs.existsSync(dbFile)) {
    const data = fs.readFileSync(dbFile, 'utf8');
    dbData = JSON.parse(data);
  } else {
    dbData = {
      users: [],
      exam_projects: [],
      workstations: [],
      materials: [],
      examiners: [],
      appointments: [],
      appointment_materials: [],
      scoring_criteria: [],
      scores: []
    };
  }

  for (const table of Object.keys(dbData)) {
    if (dbData[table].length > 0) {
      nextId[table] = Math.max(...dbData[table].map(r => r.id)) + 1;
    } else {
      nextId[table] = 1;
    }
  }
}

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(dbData, null, 2), 'utf8');
}

function all(table, conditions = {}) {
  let rows = [...dbData[table]];
  
  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined && value !== null) {
      rows = rows.filter(r => r[key] === value);
    }
  }
  
  return rows;
}

function get(table, id) {
  return dbData[table].find(r => r.id === id) || null;
}

function findOne(table, conditions) {
  return dbData[table].find(row => {
    for (const [key, value] of Object.entries(conditions)) {
      if (row[key] !== value) return false;
    }
    return true;
  }) || null;
}

function insert(table, data) {
  const id = nextId[table];
  const row = { id, ...data, created_at: data.created_at || new Date().toISOString() };
  dbData[table].push(row);
  nextId[table]++;
  saveDB();
  return { lastInsertRowid: id, changes: 1 };
}

function update(table, id, data) {
  const index = dbData[table].findIndex(r => r.id === id);
  if (index === -1) return { changes: 0 };
  dbData[table][index] = { ...dbData[table][index], ...data };
  saveDB();
  return { changes: 1 };
}

function remove(table, id) {
  const index = dbData[table].findIndex(r => r.id === id);
  if (index === -1) return { changes: 0 };
  dbData[table].splice(index, 1);
  saveDB();
  return { changes: 1 };
}

function removeWhere(table, conditions) {
  const beforeLength = dbData[table].length;
  dbData[table] = dbData[table].filter(row => {
    for (const [key, value] of Object.entries(conditions)) {
      if (row[key] !== value) return true;
    }
    return false;
  });
  const changes = beforeLength - dbData[table].length;
  if (changes > 0) saveDB();
  return { changes };
}

function count(table, conditions = {}) {
  return all(table, conditions).length;
}

function transaction(fn) {
  const backup = JSON.parse(JSON.stringify(dbData));
  try {
    const result = fn();
    saveDB();
    return result;
  } catch (error) {
    dbData = backup;
    throw error;
  }
}

function prepare(query) {
  return {
    all(...params) {
      return executeQuery(query, params, 'all');
    },
    get(...params) {
      return executeQuery(query, params, 'get');
    },
    run(...params) {
      return executeQuery(query, params, 'run');
    }
  };
}

function executeQuery(query, params, mode) {
  const normalizedQuery = query.trim().toLowerCase();
  
  if (normalizedQuery.startsWith('select')) {
    return handleSelect(query, params, mode);
  } else if (normalizedQuery.startsWith('insert')) {
    return handleInsert(query, params);
  } else if (normalizedQuery.startsWith('update')) {
    return handleUpdate(query, params);
  } else if (normalizedQuery.startsWith('delete')) {
    return handleDelete(query, params);
  }
  
  return mode === 'all' ? [] : null;
}

function handleSelect(query, params, mode) {
  const fromMatch = query.match(/from\s+(\w+)/i);
  if (!fromMatch) return mode === 'all' ? [] : null;
  
  const table = fromMatch[1];
  let rows = [...dbData[table]];
  
  const whereMatch = query.match(/where\s+(.+?)(?=\s+order\s+by|$)/i);
  if (whereMatch) {
    const whereClause = whereMatch[1].trim();
    const conditions = parseWhereClause(whereClause, params);
    rows = applyConditions(rows, conditions);
  }
  
  const joinMatches = [...query.matchAll(/join\s+(\w+)\s+(?:on|where)?\s*([^ ]+)?/gi)];
  if (joinMatches.length > 0) {
    for (const match of joinMatches) {
      const joinTable = match[1];
      const joinRows = dbData[joinTable];
      if (joinRows) {
        const onMatch = query.match(new RegExp(`on\\s+(\\w+)\\.(\\w+)\\s*=\\s*(\\w+)\\.(\\w+)`, 'i'));
        if (onMatch) {
          const [, t1, col1, t2, col2] = onMatch;
          rows = rows.map(row => {
            const joinRow = joinRows.find(jr => {
              const val1 = t1 === table ? row[col1] : row[`${t1}_${col1}`] || row[col1];
              const val2 = jr[col2];
              return val1 !== undefined && val1 === val2;
            });
            if (joinRow) {
              const merged = { ...row };
              for (const [key, val] of Object.entries(joinRow)) {
                if (merged[key] === undefined) {
                  merged[key] = val;
                } else {
                  merged[`${joinTable}_${key}`] = val;
                }
              }
              return merged;
            }
            return row;
          });
        }
      }
    }
  }
  
  const selectMatch = query.match(/select\s+(.+?)\s+from/i);
  if (selectMatch && selectMatch[1].trim() !== '*') {
    const columns = selectMatch[1].split(',').map(s => s.trim());
    rows = rows.map(row => {
      const newRow = {};
      for (const col of columns) {
        const aliasMatch = col.match(/(.+)\s+as\s+(.+)/i);
        if (aliasMatch) {
          const [, expr, alias] = aliasMatch;
          if (expr.includes('(')) {
            newRow[alias] = null;
          } else {
            newRow[alias] = row[expr] || row[alias];
          }
        } else {
          newRow[col] = row[col];
        }
      }
      return newRow;
    });
  }
  
  const orderMatch = query.match(/order\s+by\s+(.+)/i);
  if (orderMatch) {
    const orderParts = orderMatch[1].split(',').map(s => s.trim());
    rows.sort((a, b) => {
      for (const part of orderParts) {
        const [col, direction = 'asc'] = part.split(/\s+/);
        const dir = direction.toLowerCase() === 'desc' ? -1 : 1;
        if (a[col] < b[col]) return -1 * dir;
        if (a[col] > b[col]) return 1 * dir;
      }
      return 0;
    });
  }
  
  if (mode === 'get') {
    return rows[0] || null;
  }
  
  return rows;
}

function parseWhereClause(clause, params) {
  const conditions = [];
  let paramIndex = 0;
  
  const parts = clause.split(/\s+and\s+/i);
  for (const part of parts) {
    const match = part.trim().match(/(\w+)\s*=\s*\?/i);
    if (match) {
      conditions.push({ column: match[1], value: params[paramIndex++] });
    } else {
      const inMatch = part.trim().match(/(\w+)\s+in\s*\(([^)]+)\)/i);
      if (inMatch) {
        const placeholders = inMatch[2].split(',').filter(s => s.trim() === '?');
        const values = params.slice(paramIndex, paramIndex + placeholders.length);
        paramIndex += placeholders.length;
        conditions.push({ column: inMatch[1], values, op: 'in' });
      }
    }
  }
  
  return conditions;
}

function applyConditions(rows, conditions) {
  return rows.filter(row => {
    for (const cond of conditions) {
      if (cond.op === 'in') {
        if (!cond.values.includes(row[cond.column])) return false;
      } else if (cond.op === 'not_in') {
        if (cond.values.includes(row[cond.column])) return false;
      } else {
        if (row[cond.column] !== cond.value) return false;
      }
    }
    return true;
  });
}

function handleInsert(query, params) {
  const tableMatch = query.match(/into\s+(\w+)/i);
  if (!tableMatch) return { changes: 0, lastInsertRowid: 0 };
  
  const table = tableMatch[1];
  const colsMatch = query.match(/\(([^)]+)\)/);
  if (!colsMatch) return { changes: 0, lastInsertRowid: 0 };
  
  const columns = colsMatch[1].split(',').map(s => s.trim());
  const data = {};
  
  for (let i = 0; i < columns.length; i++) {
    const val = params[i];
    if (val !== undefined) {
      data[columns[i]] = val;
    }
  }
  
  return insert(table, data);
}

function handleUpdate(query, params) {
  const tableMatch = query.match(/update\s+(\w+)/i);
  if (!tableMatch) return { changes: 0 };
  
  const table = tableMatch[1];
  const setMatch = query.match(/set\s+(.+?)\s+where/i);
  if (!setMatch) return { changes: 0 };
  
  const setParts = setMatch[1].split(',').map(s => s.trim());
  const setData = {};
  let paramIndex = 0;
  
  for (const part of setParts) {
    const [col, expr] = part.split('=').map(s => s.trim());
    if (expr === '?') {
      const val = params[paramIndex++];
      if (val !== undefined) {
        setData[col] = val;
      }
    } else if (expr.includes('?')) {
      const val = params[paramIndex++];
      if (val !== undefined) {
        setData[col] = val;
      }
    }
  }
  
  const whereMatch = query.match(/where\s+(.+)$/i);
  if (whereMatch) {
    const conditions = parseWhereClause(whereMatch[1], params.slice(paramIndex));
    const rows = applyConditions(dbData[table], conditions);
    let changes = 0;
    for (const row of rows) {
      Object.assign(row, setData);
      changes++;
    }
    if (changes > 0) saveDB();
    return { changes };
  }
  
  return { changes: 0 };
}

function handleDelete(query, params) {
  const fromMatch = query.match(/from\s+(\w+)/i);
  if (!fromMatch) return { changes: 0 };
  
  const table = fromMatch[1];
  const whereMatch = query.match(/where\s+(.+)$/i);
  
  if (whereMatch) {
    const conditions = parseWhereClause(whereMatch[1], params);
    const beforeLength = dbData[table].length;
    dbData[table] = dbData[table].filter(row => {
      for (const cond of conditions) {
        if (cond.op === 'in') {
          if (cond.values.includes(row[cond.column])) return false;
        } else {
          if (row[cond.column] !== cond.value) return false;
        }
      }
      return true;
    });
    const changes = beforeLength - dbData[table].length;
    if (changes > 0) saveDB();
    return { changes };
  }
  
  const changes = dbData[table].length;
  dbData[table] = [];
  if (changes > 0) saveDB();
  return { changes };
}

function exec(sql) {
  const statements = sql.split(';').map(s => s.trim()).filter(s => s);
  for (const stmt of statements) {
    if (stmt.toLowerCase().startsWith('create table')) {
      const match = stmt.match(/create\s+table\s+if\s+not\s+exists\s+(\w+)/i) ||
                   stmt.match(/create\s+table\s+(\w+)/i);
      if (match && !dbData[match[1]]) {
        dbData[match[1]] = [];
        nextId[match[1]] = 1;
      }
    }
  }
  saveDB();
}

loadDB();

module.exports = {
  all,
  get,
  findOne,
  insert,
  update,
  remove,
  removeWhere,
  count,
  transaction,
  prepare,
  exec,
  loadDB,
  saveDB,
  data: dbData
};
