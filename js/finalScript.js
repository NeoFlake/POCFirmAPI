//Écouteur d'évènement global permettant au script de s'exécuter correctement
//uniquement quand le DOM sera intégralement chargé.

document.addEventListener("DOMContentLoaded", function(){

	// Déclaration des diverses constantes utilisées dans le script.
	//-------------------------------------------------------------

	const REQ = new XMLHttpRequest() // Initialisation de la requête API
	//Tableau des paramètres possibles dans les choix supplémentaires de recherche
	const PARAMETERS = ["department=", "postal_code="];
	//Point d'entrée de l'URL commune à toutes les requêtes passées en appel pour l'API
	const AT_THE_ENTRY_POINT ="https://firmapi.com/api/v1/companies?";

	//Variable reliant à divers éléments du DOM.

	let checkElt = document.getElementsByClassName("checkBox");
	let formElt = document.getElementById("searchForm");
	let answerElt = document.getElementById("answerZone");

	//Ajout d'un écouteur d'évènement sur la zone d'option supplémentaire pour lui permettre d'apparaître
	//---------------------------------------------------------------------------------------------------

	document.getElementById("clickableArea").addEventListener("click", function(e){

		document.getElementById("moreOptionArea").classList.remove("hidden");
		document.getElementById("clickableArea").classList.add("hidden");

	});

	// Boucle permettant d'insérer dynamiquement un écouteur d'évènement permettant
	// de faire apparaître un champ texte pour chaque option supplémentaire souhaité
	// ainsi que de réinitialiser le champ texte lors du décochage de l'option checkbox associé.

	for(let i = 0; i < checkElt.length; ++i){

		checkElt[i].addEventListener("click", function(){

			if(document.getElementById("bouton" + (i + 1)).checked){
				document.getElementById("textArea" + (i + 1)).classList.remove("hidden");
			} else {
				document.getElementById("textArea" + (i + 1)).classList.add("hidden");
				document.getElementById("textArea" + (i + 1)).value = "";
			}

		});

	}

	//Écouteur d'évènement se déclenchant à la soumission du formulaire

	formElt.addEventListener("submit", function(e){

		// Variable permettant de construire ainsi que de stocker l'URL finale
		// qui sera soumis à la requête API.
		let requestedURL = new String();
		//On ajoute directement l'URL de base à la requête avant toute autre modification
		requestedURL += AT_THE_ENTRY_POINT;
		requestedURL += "name=";
		//Récupération de la valeur comprise dans le champ nom.
		let nameRequested = document.getElementById("name").value;
		if(nameRequested.length === 0){
			nameRequested += " ";
		}
		//Transformation de cette valeur pour l'intégrer correctement à l'URL de requête
		let nameRequestSplited = nameRequested.split(" ");
		let nameInjected = new String();
		for(let i = 0; i < nameRequestSplited.length; ++i){
			if(i > 0){
				nameInjected += "%20";
			}
			nameInjected += nameRequestSplited[i];
		}
		//Constructeur d'URL.
		requestedURL += nameInjected;
		//Boucle permettant de vérifier les options numérales supplémentaires à ajouter à la requête
		for(let i = 0; i < checkElt.length; ++i){
			if(document.getElementById("bouton" + (i + 1)).checked){
				requestedURL += "&";
				requestedURL += PARAMETERS[i];
				requestedURL += document.getElementById("textArea" + (i + 1)).value;
			}
		}
		//Ajouter l'option de radiation à la query si l'option est désirée.
		if(document.getElementById("radiation").checked){
			requestedURL += "&radie=true";
		}
		// Lancement de la requête à l'API.
		REQ.open("GET", requestedURL, true);
		//Récupération des informations comprisent dans le retour à l'appel.
		//-----------------------------------------------------------------
		REQ.addEventListener("load", function(){

			//On vide la zone de réception des données.
			answerElt.innerHTML = "";
			//On parse le JSON reçu pour pouvoir en exploiter les données.
			let parsedAnswer = JSON.parse(REQ.responseText);
			//Mise en minuscule du nom passé en paramètre de recherche pour permettre un meilleur matching à la REGEX
			nameRequestedToLower = nameRequested.toLowerCase();
			// Création d'une REGEX permettant de supporter les espaces dans le paramètre de recherche
			let splitedREGEX = nameRequestedToLower.split(" ");
			let finalREGEX = new String();
			for(let i = 0; i < splitedREGEX.length; ++i){
				if(i < 0){
					finalREGEX += "\\s";
				}
				finalREGEX += splitedREGEX[i];
			}
			let regAnswer = new RegExp(finalREGEX);

			//Création dynamique du DOM permettant le recueil des informations récupérées par la requête API
			//----------------------------------------------------------------------------------------------
			let answerDivElt = document.createElement("div");

			//Boucle de création du DOM réceptacle.
			for(let i = 0; i < parsedAnswer.companies.length; ++i){
				//Vérification que le champ Nom de l'entreprise est bien renseignée dans l'API
				if(parsedAnswer.companies[i].names.denomination != null){
					//Si l'entreprise est bien renseignée on va pouvoir tenter de matcher son nom avec celui
					// renseigné par l'utilisateur.
					let nameOfCompanyToLower = parsedAnswer.companies[i].names.denomination.toLowerCase();
					if(regAnswer.test(nameOfCompanyToLower)){
						//Si les deux chaîne match exactement...
						//1 - Création du DOM nécessaire.
						let companyElt = document.createElement("div");
						//Configuration initiale de ses classes et pose d'un overflow hidden.
						companyElt.classList.add("noHeight");
						companyElt.classList.add("switchableArea");
						companyElt.style.overflow = "hidden";
						//Création de la zone DOM contenant le nom de l'entreprise.
						let titleDivElt = document.createElement("div");
						//Configuration initiale de la zone de titre et ajout de l'évènement permettant le 
						//déployement des informations en dessous.
						titleDivElt.style.cursor = "pointer";
						titleDivElt.addEventListener("click", function(){
							if(companyElt.classList.contains("withHeight")){
								companyElt.classList.add("noHeight");
								companyElt.classList.remove("withHeight");
							} else if(companyElt.classList.contains("noHeight")){
								// Dans ce cas de figure, il faut vérifier si aucune zone ne possède la classe "withHeight"
								// pour permettre de les replier et n'en garder qu'une ouverte à la fois (plus esthétique pour le client).
								for(let j = 0; j < document.getElementsByClassName("switchableArea").length; ++j){
									if(document.getElementsByClassName("switchableArea")[j].classList.contains("withHeight")){
										document.getElementsByClassName("switchableArea")[j].classList.remove("withHeight");
										document.getElementsByClassName("switchableArea")[j].classList.add("noHeight");
									}	
								}
								companyElt.classList.add("withHeight");
								companyElt.classList.remove("noHeight");
							}
						});
						//Création de la zone recevant le nom de l'entreprise
						let companyNameElt = document.createElement("h2");
						//Mise en place du texte à l'intérieur de la zone
						companyNameElt.innerHTML = parsedAnswer.companies[i].names.denomination;
						//Mise en place des diverses zones d'informations que l'on souhaite présenter au client
						let companySigleElt = document.createElement("p");
						companySigleElt.innerHTML = parsedAnswer.companies[i].names.sigle;

						let companyAddressElt = document.createElement("p");
						companyAddressElt.innerHTML = parsedAnswer.companies[i].address;

						let companyPostalCodeElt = document.createElement("p");
						companyPostalCodeElt.innerHTML = parsedAnswer.companies[i].postal_code;

						let companyCityElt = document.createElement("p");
						companyCityElt.innerHTML = parsedAnswer.companies[i].city;

						let companySIRENElt = document.createElement("p");
						companySIRENElt.innerHTML = parsedAnswer.companies[i].siren;

						let companyRadieElt = document.createElement("p");
						companyRadieElt.innerHTML = parsedAnswer.companies[i].radie;

						//Construction du DOM en allant de l'enfant au parent 
						//(le DOM se rempli toujours en allant du plus petit au plus grand).
						titleDivElt.appendChild(companyNameElt);

						companyElt.appendChild(companySigleElt);
						companyElt.appendChild(companyAddressElt);
						companyElt.appendChild(companyPostalCodeElt);
						companyElt.appendChild(companyCityElt);
						companyElt.appendChild(companySIRENElt);
						companyElt.appendChild(companyRadieElt);

						answerDivElt.appendChild(titleDivElt);
						answerDivElt.appendChild(companyElt);
					}
				}
			}

			//Injection finale de DOM allant de la zone que l'on vient de construire
			//intégralement vers le DOM déjà implanté dans la page HTML
			answerElt.appendChild(answerDivElt);
		});

		//Réinitialisation de la variable pour utilisation ultérieure
		nameRequestedToLower = "";

		REQ.send(null);
		//Permet de bypass la fonction primaire d'un formulaire qui effectue un
		// raffraîchissement de la page lorsqu'il est soumis.
		e.preventDefault();
		
	});
});