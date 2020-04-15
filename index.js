addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const rewriter = new HTMLRewriter()
    .on("title", new TitleHandler())
    .on("h1#title", new HeadingHandler())
    .on("p#description", new DescriptionHandler())
    .on("a#url", new URLHandler());

  // array of variants
  const variants = await getVariants();

  // get "variant" cookie from cookies: either 0 or 1 if exists
  const { headers } = request;
  const cookies = headers.get("cookie");
  const variantCookie = getCookie(cookies, "variant");

  if (variantCookie) {
    // persist the variant
    const index = parseInt(variantCookie);
    const res = await fetch(variants[index]);
    return rewriter.transform(res);
  } else {
    // set cookies for persistence
    const index = Math.floor(Math.random() * variants.length);
    const res = await fetch(variants[index]);
    const resClone = new Response(res.body, res);
    resClone.headers.set("Set-Cookie", "variant=" + index);
    return rewriter.transform(resClone);
  }
}

class TitleHandler {
  element(element) {
    element.setInnerContent("Changed title");
  }
}

class HeadingHandler {
  element(element) {
    element.setInnerContent("Changed heading");
  }
}

class DescriptionHandler {
  element(element) {
    element.setInnerContent("Follow the link to see my portfolio website!");
  }
}

class URLHandler {
  element(element) {
    element.setAttribute("href", "http://zhantore.herokuapp.com/");
    element.setInnerContent("My portfolio");
  }
}

const getCookie = (cookies, cookiename) => {
  const cookie = RegExp(cookiename + "=[^;]+").exec(cookies);
  return decodeURIComponent(
    cookie ? cookie.toString().replace(/^[^=]+./, "") : ""
  );
};

const getVariants = async () => {
  const response = await fetch(
    "https://cfw-takehome.developers.workers.dev/api/variants"
  );
  const body = await response.json();
  return body.variants;
};
