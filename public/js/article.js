/*                            
 * Valid rating types:
 * Informative, Documented, Well-Written 
 * Improvable, Uncited, Confusing,
 * Misleading, Biased, Outdated
 *
 */

function Article (title, contents, author, optional) {
  this.title = title;
  this.contents = contents;
  this.author = author;
  this.tags = [];
  this.rating = {};

  if (typeof optional !== 'undefined') {
    if (optional.tags !== 'undefined') 
      this.tags = optional.tags;

    if (optional.rating !== 'undefined') { 
      for (var element in optional.rating) {
        this.rating[rating] = optional.rating[rating];
    } }
  }
}



/* Unused
 *
function newArticle (title, contents, author, optional) { 
  article = {
      title: title
    , contents: contents
    , author: author
    , rating: { }
  }

  if (typeof optional !== 'undefined') {
    for (var rating in optional) {
      article.rating[rating] = optional[rating];
    }
  }

  return article;
}
*/
