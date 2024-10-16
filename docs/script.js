const Placeholder = /** @type {HTMLElement | null} */ (
  document.getElementById("div-placeholder")
);
const Status = /** @type {HTMLElement | null} */ (
  document.getElementById("div-status")
);
const Passwd = /** @type {HTMLElement | null} */ (
  document.getElementById("div-passwd")
);
const FontPasswd = /** @type {HTMLElement | null} */ (
  document.getElementById("font-passwd")
);
const ImgStats = /** @type {HTMLImageElement | null} */ (
  document.getElementById("img-stats")
);
const SeedInp = /** @type {HTMLInputElement | null} */ (
  document.getElementById("txt-seed")
);
const IterInp = /** @type {HTMLInputElement | null} */ (
  document.getElementById("txt-iter")
);
const GenBtn = /** @type {HTMLButtonElement | null} */ (
  document.getElementById("btn-gen")
);
const CopyBtn = /** @type {HTMLButtonElement | null} */ (
  document.getElementById("btn-copy")
);

if (
  !Placeholder ||
  !Status ||
  !Passwd ||
  !FontPasswd ||
  !ImgStats ||
  !SeedInp ||
  !IterInp ||
  !GenBtn ||
  !CopyBtn
) {
  console.table({
    Placeholder,
    Status,
    Passwd,
    FontPasswd,
    ImgStats,
    SeedInp,
    IterInp,
    GenBtn,
    CopyBtn,
  });
  throw new Error("missing one or more elements");
}

/**
 * Copy the password to the clipboard
 * @returns {void}
 * @see https://stackoverflow.com/a/30810322/8608146
 */
const copyToClipboard = function () {
  // copy the password to the clipboard using latest APIs
  navigator.clipboard
    .writeText(FontPasswd.innerHTML)
    .then(() => {
      const btnCopy = document.getElementById("btn-copy");
      if (!btnCopy) {
        console.error("missing copy button");
        return;
      }
      // change the icon to a check mark for 1.5 seconds
      setTimeout(() => {
        btnCopy.innerHTML = '<i class="far fa-copy"></i>';
      }, 1500);
      btnCopy.innerHTML = '<i class="fas fa-check"></i> Copied';
    })
    .catch((err) => {
      console.error(err);
    });
};

/**
 * Generate a sha256 hash from the seed with the hex string formatted to have alternating upper and lower case characters
 * @param {string} seed - The seed string
 * @returns {Promise<string>} - The sha256 hash generated from the seed
 */
const sha256sum = async function (seed) {
  const hash = await crypto.subtle
    // @ts-ignore
    .digest("SHA-256", new TextEncoder("utf-8").encode(seed));
  const hexString = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const formattedString = hexString
    .split("")
    .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
    .join("");
  return formattedString;
};

/**
 * Generate a hash from the seed by performing iter number of sha256 iterations on the seed
 * @param {string} seed - The seed string
 * @param {number} iter - The number of iterations to perform on the seed
 * @returns {Promise<string>} - The hash generated from the seed
 */
const mkhash = async function (seed, iter) {
  let hash = seed;

  // keep track of the time taken to perform the last iteration
  let lastTime = Date.now();
  let timePer1000Iteration = 0;

  for (let i = 0; i < iter; ++i) {
    hash = await sha256sum(hash);
    // show % of iterations completed in the status
    Status.innerHTML = `Generating... ${((i / iter) * 100).toFixed(2)}%<br>`;

    let timeEstimate = 0;
    // estimate time remaining using the time taken to perform the last 1000 iterations
    if (i == 1000) {
      timePer1000Iteration = Date.now() - lastTime;
      // cut down the iterations by 50 to reduce overall time taken
      iter /= 50;
    } else if (i > 1) {
      /* calculate remaining time using the timePer1000Iteration for the whole loop to complete
               and the no of iterations remaining */
      const timePerIteration = timePer1000Iteration / 1000;
      timeEstimate = ((iter - i) * timePerIteration) / 1000;
    }

    // set the time unit to second
    let timeUnit = timeEstimate > 1 ? "seconds" : "second";
    // convert to min, hr, day, yr, etc. if time remaining is greater than 60 seconds
    if (timeEstimate > 60) {
      timeEstimate /= 60;
      timeUnit = timeEstimate > 1 ? "minutes" : "minute";
      if (timeEstimate > 60) {
        timeEstimate /= 60;
        timeUnit = timeEstimate > 1 ? "hours" : "hour";
        if (timeEstimate > 24) {
          timeEstimate /= 24;
          timeUnit = timeEstimate > 1 ? "days" : "day";
          if (timeEstimate > 365) {
            timeEstimate /= 365;
            timeUnit = timeEstimate > 1 ? "years" : "year";
          }
        }
      }
    }
    Status.innerHTML += ` (${timeEstimate.toFixed(2)} ${timeUnit} remaining)`;
  }
  return hash;
};

/**
 * Generate the password and QR code image from the seed
 * @typedef {Object} chrome.tabs.Tab
 * @param {string} seed - The seed string
 * @param {number} iter - The number of iterations to perform on the seed
 * @param {chrome.tabs.Tab[] | null} tabs - The active tab
 * @returns {Promise<void>}
 * @see https://developer.chrome.com/docs/extensions/reference/tabs/#method-query
 * @see https://developer.chrome.com/docs/extensions/reference/tabs/#type-Tab
 * @see https://developer.chrome.com/docs/extensions/reference/tabs/#type-QueryInfo
 * @see https://developer.chrome.com/docs/extensions/reference/tabs/#type-TabStatus
 */
const main = async function (seed, iter, tabs) {
  // get domain name from the active tab
  if (tabs && tabs.length === 0) {
    console.error("no active tab found");
    return;
  }
  const activeTab = tabs ? tabs[0] : null;
  const domainName = activeTab
    ? new URL(activeTab.url).hostname
    : new URL(window.location.href).hostname;

  // replace %d with the domain name in the seed
  seed = domainName ? seed.replace(/%d/g, domainName) : seed;
  // iter = parseInt(iter);

  // print the seed and iter values
  console.log(`seed: ${typeof seed}: ${seed}`);
  console.log(`iter: ${typeof iter}: ${iter}`);

  // hide the placeholder or passed and show the status
  Passwd.style.display = "none";
  Placeholder.style.display = "none";
  Status.style.display = "flex";

  // disable the generate button
  GenBtn.disabled = true;

  // generate the hash from the seed
  const hash = await mkhash(seed, iter);

  /* create a password from the hash by taking the 8th to 15th characters and reversing them
       and then adding a '@' in the middle of the 15th and 22nd characters */
  const pass =
    hash.substring(15, 21) +
    "@" +
    hash.substring(8, 13).split("").reverse().join("");

  // print the password
  console.log(`pass: ${typeof pass}: ${pass}`);

  // generate the QR code image from the password
  // using alternative as Google turned off 'chart.googleapis.com' API
  const statsImg = `https://image-charts.com/chart?cht=qr&choe=UTF-8&chs=256x256&chl=${encodeURIComponent(
    pass
  )}`;

  // hide the status and show the password and QR code image
  Status.style.display = "none";
  Passwd.style.display = "flex";
  ImgStats.style.display = "block";

  // enable the generate button
  GenBtn.disabled = false;

  // set the password and QR code image
  FontPasswd.innerHTML = pass;
  ImgStats.src = statsImg;
};

const genOnSubmit = function () {
  let seed = SeedInp.value.trim();
  if (!seed) {
    // default seed: stands for the domain name of the active tab
    seed = "%d";
  }

  let iterStr = IterInp.value.trim();
  if (!iterStr) {
    iterStr = String(Math.floor(Math.random() * Math.pow(2, 16) + 10000));
  }

  let iter = 0;
  try {
    iter = parseInt(iterStr);
  } catch (err) {
    alert("Invalid iteration value");
    return;
  }

  /* generate a 16 character long password from the sha512 hash of the seed
     if iter is absent then assume a random iter b/w 1 and pow(2,8) otherwise perform len / iter numbers
     of SHA-256 hashing iterations on the seed */
  SeedInp.value = seed;
  IterInp.value = String(iter);
  // @ts-ignore
  if (chrome?.tabs?.query) {
    // @ts-ignore
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) =>
      main(seed, iter, tabs)
    );
    document.body.style.border = "var(--border-style)";
  } else {
    main(seed, iter, null);
  }
};

GenBtn.onclick = genOnSubmit;
CopyBtn.onclick = copyToClipboard;
