const app = new Vue({
  //create new Vue instance and specifying the necessary details
  el: "#app", //working with element having specified id
  data: {
    //initialise the values
    url: "",
    slug: "",
    error: "",
    formVisible: true,
    created: null,
  },
  methods: {
    async createUrl() {
      //make a method to create url
      this.error = "";
      const response = await fetch("/url", {
        //fetch reponse from the api created using POST request
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          url: this.url,
          slug: this.slug || undefined,
        }),
      });
      if (response.ok) {
        //if we get a response hide the form and show the short url created
        const result = await response.json();
        this.formVisible = false;
        this.created = `https://naughty-sh.herokuapp.com/${result.slug}`;
      } else if (response.status === 429) {
        //if we get too many requests from the same ip we send the error
        this.error =
          "You are sending too many requests. Try again in 30 seconds.";
      } else {
        const result = await response.json();
        this.error = result.message;
      }
    },
  },
});
