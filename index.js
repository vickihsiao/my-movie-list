(function () {

  // =================== Declare Variables ===================
  const BASE_URL = 'https://movie-list.alphacamp.io'
  const INDEX_URL = BASE_URL + '/api/v1/movies/'
  const POSTER_URL = BASE_URL + '/posters/'

  const dataPanel = document.getElementById('data-panel')
  const searchForm = document.getElementById('search')
  const searchInput = document.getElementById('search-input')
  const pagination = document.getElementById('pagination')
  // 新增
  const displayModeSelector = document.getElementById('display-mode-selector')

  const data = []
  let paginationData = []
  const ITEM_PER_PAGE = 12
  // 新增變數記錄display mode (card or list)
  let displayMode = 'card'
  // 新增變數記錄current page
  let currentPage = 1

  // =================== Declare Functions ===================

  function loadData() {
    axios.get(INDEX_URL).then((response) => {
      data.push(...response.data.results)
      getTotalPages(data)
      // default 的 display mode 為 card 圖示顯示
      displayMode = 'card'
      getPageData(1, data)
    }).catch((err) => console.log(err))
  }

  function getTotalPages(data) {
    let totalPages = Math.ceil(data.length / ITEM_PER_PAGE) || 1
    let pageItemContent = ''
    for (let i = 0; i < totalPages; i++) {
      pageItemContent += `
        <li class="page-item">
          <a class="page-link" href="javascript:;" data-page="${i + 1}">${i + 1}</a>
        </li>
      `
      // a 標籤必須具有 href屬性，才能算是有效標籤。然而，pagination 的 a 標籤並不會觸發跳頁，因此，實務上會加入像 "javascript:;" 之類的字串，註明這個 a 標籤會觸發 JavaScript 程式。
    }
    pagination.innerHTML = pageItemContent
  }

  function getPageData(pageNum, data) {
    paginationData = data || paginationData
    let offset = (pageNum - 1) * ITEM_PER_PAGE
    let pageData = paginationData.slice(offset, offset + ITEM_PER_PAGE)
    displayDataList(pageData)

    // deactive pagination state
    // Note: forEach on Node List is not working on older browswer, and below is the workaround method
    // Reference: https://stackoverflow.com/questions/31338097/why-it-is-not-possible-to-call-foreach-on-a-nodelist
    Array.prototype.forEach.call(pagination.children, item => {
      item.className = "page-item"
    })
    // and only set the current pagination state active 
    pagination.children[pageNum - 1].className = "page-item active"

  }

  function displayDataList(data) {
    let htmlContent = ''
    if (displayMode === 'card') {                 // card mode 版型
      data.forEach(function (item, index) {
        htmlContent += `
          <div class="col-sm-3">
            <div class="card mb-2">
              <img class="card-img-top " src="${POSTER_URL}${item.image}" alt="Card image cap">
              <div class="card-body movie-item-body">
                <h5 class="card-title">${item.title}</h5>
              </div>

              <div class="card-footer">
                <!-- "More" button -->
                <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}">More</button>
                <!-- favorite button -->
                <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>            
              </div>
            </div>
          </div>
        `
      })
    } else if (displayMode === 'list') {        // list mode 版型
      htmlContent += `
        <table class="table">
          <tbody>
      `
      data.forEach(function (item, index) {
        htmlContent += `
          <tr class="row">
            <td class="col-sm-8">${item.title}</td>
            <td class="col-sm-4">
                <!-- "More" button -->
                <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}">More</button>
                <!-- favorite button -->
                <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>                        
            </td>
          </tr>
        `
      })
      htmlContent += `
          </tbody>
        </table>
      `
    }
    dataPanel.innerHTML = htmlContent
  }

  function showMovie(id) {
    // get elements
    const modalTitle = document.getElementById('show-movie-title')
    const modalImage = document.getElementById('show-movie-image')
    const modalDate = document.getElementById('show-movie-date')
    const modalDescription = document.getElementById('show-movie-description')

    // set request url
    const url = INDEX_URL + id
    console.log(url)

    // send request to show api
    axios.get(url).then(response => {
      const data = response.data.results
      console.log(data)

      // insert data into modal ui
      modalTitle.textContent = data.title
      modalImage.innerHTML = `<img src="${POSTER_URL}${data.image}" class="img-fluid" alt="Responsive image">`
      modalDate.textContent = `release at : ${data.release_date}`
      modalDescription.textContent = `${data.description}`
    })
  }

  // 將收藏電影放入 local storage 儲存
  function addFavoriteItem(id) {
    const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
    const movie = data.find(item => item.id === Number(id))

    if (list.some(item => item.id === Number(id))) {
      alert(`${movie.title} is already in your favorite list.`)
    } else {
      list.push(movie)
      alert(`Added ${movie.title} to your favorite list!`)
    }
    console.log(list)
    localStorage.setItem('favoriteMovies', JSON.stringify(list))
  }


  // =================== Code starts from here ===================

  loadData()

  // listen to data panel
  dataPanel.addEventListener('click', (event) => {
    if (event.target.matches('.btn-show-movie')) {
      showMovie(event.target.dataset.id)
    } else if (event.target.matches('.btn-add-favorite')) {
      addFavoriteItem(event.target.dataset.id)
    }
  })

  // listen to search form submit event
  searchForm.addEventListener('submit', event => {
    event.preventDefault()

    let results = []
    const regex = new RegExp(searchInput.value, 'i')

    results = data.filter(movie => movie.title.match(regex))
    getTotalPages(results)
    getPageData(1, results)
  })

  // listen to display mode click event
  displayModeSelector.addEventListener('click', event => {
    console.log('toggle display mode')
    displayMode = event.target.dataset.displaymode
    getTotalPages(data)
    getPageData(currentPage, data)
  })

  // listen to pagination click event
  pagination.addEventListener('click', event => {
    // 如果點擊到 a 標籤，則透過將頁碼傳入 getPageData 來切換分頁。
    if (event.target.tagName === 'A') {
      currentPage = event.target.dataset.page
      getPageData(currentPage, data)
    }
  })


})()

