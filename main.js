const query = document.querySelectorAll.bind(document)
const id = document.getElementById.bind(document)

if (window.Worker) {
  window.solver = new Worker("worker.js");

  solver.onmessage = function (e) {
    if (e.data[0] === 'solve') {
      window.game.solution = e.data[1]

      if (window.game.finished) {
        handleSolution()
      }
    }
  }

// every day
function shuffle() {
  return new Promise((resolve, reject) => {
    const items = [
      { id: "num-target", time: 750, items: 999 },
      { id: "num-1", time: 350, items: 9 },
      { id: "num-2", time: 350, items: 9 },
      { id: "num-3", time: 350, items: 9 },
      { id: "num-4", time: 350, items: 9 },
      { id: "num-5", time: 350, items: [10, 15, 20] },
      { id: "num-6", time: 350, items: [25, 50, 75, 100] },
    ]

    let curr = 0
    let el = id(items[curr].id)
    el.classList.add('is-warning')

    query('button.play').forEach(b => b.setAttribute('disabled', 'disabled'))

    let ticker = setInterval(() => {
      const obj = items[curr]

      if (Array.isArray(obj.items)) {
        el.value = obj.items[Math.floor(Math.random() * obj.items.length)];
      } else {
        el.value = Math.floor(Math.random() * obj.items) + 1;
      }
    }, 10)

    setTimeout(function tms() {
      el.classList.remove('is-warning')
      el.parentElement.classList.remove('is-warning')
      curr++

      if (curr == items.length) {
        clearInterval(ticker)
        ticker = null
        setTimeout(() => {
          query('button.play').forEach(b => b.removeAttribute('disabled'))
          resolve()
        }, 750)  
      } else {
        el = id(items[curr].id)
        el.parentElement.classList.add('is-warning')

        setTimeout(tms, items[curr].time)
      }
    }, items[curr].time)
  })
}

// everybody play the game
function startGame(type) {
  lockTarget(true)
  let tEl = id('num-target')
  let task = [tEl.value]

  window.game = {
    solution: "",
    expr: [],
    time: 50,
    startedAt: null,
    finished: false,
    finishedAt: null,
    target: parseInt(tEl.value),
    input: [],
    type: type
  }

  for (let i = 1; i < 7; i++) {
    let n = id('num-' + i).value
    task.push(n)
    id('btn-' + i).innerText = n
    game.input.push(n)
  }

  const timeLabel = id('time-label')
  const finderStatus = id('finder-status')
  timeLabel.innerText = '0:50'

  hide('panel-start', 'panel-found', 'panel-correct', 'panel-incorrect', 'panel-input')
  show('panel-expr', 'panel-time', 'panel-keyboard')
  
  window.gameTicker = setInterval(function () {
    game.time--

    if (game.time >= 0) {
      timeLabel.innerText = (game.time < 10 ? '0:0' : '0:') + game.time.toString()
    }

    if (!game.finished && game.time == 0 ) {
      finishGame()  
    }

    if (game.solution == "") {
      let t = Math.floor((new Date() - game.startedAt)/1000)
      let min = Math.floor(t/60)
      let sec = t % 60
      finderStatus.innerText = min.toString() + ':' + (sec < 10 ? '0' : '') + sec.toString()
    }

  }, 1000)

  game.startedAt = new Date()
  query('.btn-op, .btn-pc').forEach(x => x.setAttribute('disabled', 'disabled'))
  query('.btn-num, .btn-po').forEach(x => x.removeAttribute('disabled'))
  renderExpr()

  solver.postMessage(['solve', task.join(' ')])
  id('panel-target').scrollIntoView()
}

function finishGame() {
  game.finished = true
  game.finishedAt = new Date()

  hide('panel-time', 'panel-keyboard')
  handleSolution()
}

function show(...ids) {
  ids.forEach(e => id(e).classList.remove('is-hidden'))
}

function hide(...ids) {
  ids.forEach(e => id(e).classList.add('is-hidden'))
}

function last(a) {
  if (a.length > 0) {
    return a[a.length - 1]
  } else {
    return undefined
  }
}

function handleSolution() {
  if (game.solution == "") {
    show('panel-finding')
    hide('panel-found')
  } else {
    clearInterval(window.gameTicker)
    window.gameTicker = null
    
    let sol = game.solution.split('|', 2)
    hide('panel-finding')

    id('finder-formula').innerText = sol[0]
    id('finder-time').innerText = sol[1]

    let val = parseInt(last(sol[0].split(' ')))
    let time = game.finishedAt - game.startedAt

    if (time > 50_000) {
      time = 50_000
    }

    if (val == calculateExpr(game.expr)) {
      // correct
      if (game.type == 'random') {
        updateStats(time, true)
      }
      
      id('user-time').innerText = ms2sec(time)
      show('panel-start', 'panel-input', 'panel-found', 'panel-correct')
    } else {
      if (game.type == 'random') {
        updateStats(time, false)
      }
      show('panel-start', 'panel-input', 'panel-found', 'panel-incorrect')
    }

    lockTarget(false)
    id('panel-input').scrollIntoView()
  }
}

function updateStats(time, correct) {
  let totalTime = parseInt(localStorage.getItem('total_time') || '0')
  let totalCount = parseInt(localStorage.getItem('total_count') || '0')

  localStorage.setItem('total_time', (totalTime + time).toString())
  localStorage.setItem('total_count', (totalCount + 1).toString())

  if (correct) {
    let winTime = parseInt(localStorage.getItem('win_time') || '0')
    let winCount = parseInt(localStorage.getItem('win_count') || '0')

    localStorage.setItem('win_time', (winTime + time).toString())
    localStorage.setItem('win_count', (winCount + 1).toString())
    localStorage.setItem('last_win_time', time.toString())
  }  
}

function renderStats() {
  let totalTime = parseInt(localStorage.getItem('total_time') || '0')
  let totalCount = parseInt(localStorage.getItem('total_count') || '0')
  let winTime = parseInt(localStorage.getItem('win_time') || '0')
  let winCount = parseInt(localStorage.getItem('win_count') || '0')
  let lastWinTime = parseInt(localStorage.getItem('last_win_time') || '0')

  id('stat-total-count').innerText = totalCount.toString()
  id('stat-win-count').innerText = winCount.toString()
  id('stat-total-time').innerText = ms2time(totalTime)
  id('stat-avg-time').innerText = ms2sec(winCount == 0 ? 0 : winTime/winCount)
  id('stat-last-time').innerText = ms2sec(lastWinTime)

  let rating = Math.round(100*winCount/(totalCount == 0 ? 1:totalCount))
  let re = id('stat-rating')
  re.innerText = rating.toString() + '%'

  if (rating > 90) {
    re.classList.add('has-text-success')
    re.classList.remove('has-text-danger')
  } else if (rating < 50) {
    re.classList.remove('has-text-success')
    re.classList.add('has-text-danger')
  } else {
    re.classList.remove('has-text-success', 'has-text-danger')
  }

  id('modal-stats').classList.add('is-active')
}

function renderExpr() {
  id('user-formula').innerText = game.expr.map(e => e.k).join('')

  let res = calculateExpr(game.expr)
  let el = id('user-result')
  el.innerText = res ? ('= '+res.toString()) : '= X'

  if (res == game.target) {
    el.classList.add('has-text-success')
  } else {
    el.classList.remove('has-text-success')
  }

  let btn = id('btn-submit')

  if (res) {
    btn.removeAttribute('disabled')
  } else {
    btn.setAttribute('disabled', 'disabled')
  }
}

function lockTarget(lock) {
  let v = id('target-view')

  if (lock) {
    query('.target-input').forEach(e => e.classList.add('is-hidden'))
    v.innerText = id('num-target').value
    v.classList.remove('is-hidden')
  } else {
    v.classList.add('is-hidden')
    query('.target-input').forEach(e => e.classList.remove('is-hidden'))
  }
}

function showRules() {
  let c = localStorage.getItem("show_rules")
  id('chk-show-rules').checked = (c == "yes" || c == null)
  id('modal-rules').classList.add('is-active')
}

function optionalRulesDisplay() {
  return new Promise((resolve, reject) => {
    let c = localStorage.getItem("show_rules")

    if (!(c == "yes" || c == null)) {
      resolve()
    } else {
      id('btn-rules-close').addEventListener('click', () => resolve(), {once: true})
      showRules()
    }
  })
}

function calculateExpr(expr) {
  let stack = []
  let queue = []
  const ops = ['+', '-', '*', '/']
  const prec = {
    '+': 2,
    '-': 2,
    '*': 3,
    '/': 3
  }
  
  // parse via shunting yard algo
  for (const item of expr) {
    let c = item.k

    if (ops.includes(c)) {
      while (true) {
        let op2 = last(stack)

        if (op2 === undefined || op2 === '(') {
          break
        }

        if (prec[op2] >= prec[c]) {
          stack.pop()
          queue.push(op2)
        } else {
          break
        }
      }
      stack.push(c)
    } else if (c === '(') {
      stack.push(c)
    } else if (c === ')') {
      while (true) {
        let op2 = stack.pop()

        if (op2 === undefined) {
          return ''
        }

        if (op2 === '(') {
          break
        }

        queue.push(op2)
      }
    } else {
      queue.push(c)
    }
  }

  while (true) {
    let op = stack.pop()

    if (op === undefined) {
      break
    }

    if (op === '(' || op === ')') {
      return ''
    }

    queue.push(op)
  }

  //calculate
  if (queue.length == 0) {
    return ''
  }
  if (queue.length == 1) {
    return queue[0]
  }

  let stack2 = []

  for (let i = 0; i < queue.length; i++) {
    if (ops.includes(queue[i])) {
      let b = stack2.pop()
      let a = stack2.pop()

      if (a === undefined || b === undefined) {
        return ''
      }

      let c = calc(queue[i], a, b)

      if (c === null) {
        return ''
      }

      stack2.push(c)
    } else {
      stack2.push(queue[i])
    }
  }

  return stack2.pop()
}

function calc(op, sa, sb) {
  let a = parseInt(sa)
  let b = parseInt(sb)
  switch (op) {
    case '+':
      return a + b;
    case '-':
      if (a < b) return null
      return a - b
    case '*':
      return a * b
    case '/':
      if (b == 0) return null
      if (a%b != 0) return null
      return a / b
    default:
      return null
  }
}

(function() {
  id('btn-play').onclick = function () {
    shuffle().then(optionalRulesDisplay).then(() => startGame('random'))
  }

  id('btn-play2').onclick = function () {
    let el = id('num-target')
    let n = parseInt(el.value)

    if (n > 0 && n <= 999) {
      el.classList.remove('is-danger')
      optionalRulesDisplay().then(() => startGame('set'))
    } else {
      el.classList.add('is-danger')
    }
  }

  id('btn-rules').onclick = function () {
    showRules()
  }

  id('btn-stats').onclick = function () {
    renderStats()
  }

  id('btn-submit').onclick = function () {
    finishGame()
  }

  id('btn-rules-close').onclick = function () {
    id('modal-rules').classList.remove('is-active')

    //save preferences
    let c = id('chk-show-rules').checked
    localStorage.setItem("show_rules", c ? "yes" : "no")
  }

  id('btn-stats-close').onclick = function () {
    id('modal-stats').classList.remove('is-active')
  }

  query('[data-key]').forEach(el => {
    el.addEventListener('click', (e) => {
      let key = e.currentTarget.getAttribute('data-key')
      const opsAll = ['+', '-', '*', '/', '(', ')']
      const ops = ['+', '-', '*', '/']

      if (opsAll.includes(key)) {
        game.expr.push({k: key, ref: null})
      } else if (key == 'b') {
        game.expr.pop()
      } else if (key == 'c') {
        game.expr = []
      } else {
        game.expr.push({k: game.input[parseInt(key)], ref: e.currentTarget})
      }

      let prs = game.expr.reduce((acc, val) => {
        if (val.k === '(') return acc + 1
        if (val.k === ')') return acc - 1
        return acc
      }, 0)

      if (game.expr.length > 0) {
        let last = game.expr[game.expr.length - 1]

        if (ops.includes(last.k)) {
          query('.btn-op, .btn-pc').forEach(x => x.setAttribute('disabled', 'disabled'))
          query('.btn-num, .btn-po').forEach(x => x.removeAttribute('disabled'))
        } else if (last.k == '(') {
          query('.btn-op, .btn-pc, .btn-po').forEach(x => x.setAttribute('disabled', 'disabled'))
          query('.btn-num').forEach(x => x.removeAttribute('disabled'))
        } else if (last.k == ')') {
          query('.btn-num, .btn-pc, .btn-po').forEach(x => x.setAttribute('disabled', 'disabled'))
          query('.btn-op').forEach(x => x.removeAttribute('disabled'))
        } else {
          query('.btn-num, .btn-po').forEach(x => x.setAttribute('disabled', 'disabled'))
          query('.btn-op').forEach(x => x.removeAttribute('disabled'))

          if (prs > 0) {
            query('.btn-pc').forEach(x => x.removeAttribute('disabled'))
          }
        }

        for (const x of game.expr) {
          if (x.ref) {
            x.ref.setAttribute('disabled', 'disabled')
          }
        }
      } else {
        query('.btn-op, .btn-pc').forEach(x => x.setAttribute('disabled', 'disabled'))
        query('.btn-num, .btn-po').forEach(x => x.removeAttribute('disabled'))
      }

      renderExpr()
    })
  })
})()

} else {
  // no soup for you
  alert('Browser not supported!')
}

function ms2time(s) {
  let ms = s % 1000;
  s = (s - ms) / 1000;
  let sec = s % 60;
  s = (s - sec) / 60;
  let m = s % 60;
  let h = (s - m) / 60;

  return [h,m,sec].map(t => t < 10 ? ('0' + t.toString()) : t.toString()).join(':')
}

function ms2sec(ms) {
  return (ms/1000).toFixed(1).toString() + 's'
}