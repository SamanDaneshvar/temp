// The app's Firebase project configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCZ_QSTi7a41zQa4wtO-c53tpK1PVnFxYM",
  authDomain: "python-certificates.firebaseapp.com",
  projectId: "python-certificates",
  storageBucket: "python-certificates.appspot.com",
  messagingSenderId: "337313845571",
  appId: "1:337313845571:web:c84ee85fa623a098f81ff6",
  measurementId: "G-Z6WM0SCQ0T"
};
// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);


// Named constants for the database references
const DB = firebase.firestore();
const CERTIFICATES_REF = DB.collection("certificates");
const STUDENTS_REF = DB.collection("students");
// Site URL
const SITE_URL = document.location.origin;
// For search by certificate number or by name
const QUERY = {
  certificate_number: document.querySelector("#query_cert"),
  first_name: document.querySelector("#query_first_name"),
  last_name: document.querySelector("#query_last_name"),
};
// For displaying the list of a student's certificate numbers
const LIST_OF_CERTIFICATES = document.querySelector("#list_of_certificates");
// For displaying the retrieved certificate information
const DISPLAY = {
  first_name: document.querySelector("#first_name"),
  last_name: document.querySelector("#last_name"),
  total_certificates: document.querySelector("#total_certificates"),
  certificate_number: document.querySelector("#certificate_number"),
  date_of_issue: document.querySelector("#date_of_issue"),
  status: document.querySelector("#status"),
  course_name: document.querySelector("#course_name"),
  course_length: document.querySelector("#course_length"),
  curriculum: document.querySelector("#course_curriculum"),
  grade: document.querySelector("#certification_grade"),
  achievability: document.querySelector("#achievability"),
};


function click_handler(event) {
  MATCHES = ["search_by_cert_button", "search_by_name_button"];
  PARTIAL_MATCHES = ["display_certificate_"];
  
  // Short circuit on any target that is not a match (not to be handled).
  if ( !MATCHES.includes(event.target.id) && !includes(event.target.id, PARTIAL_MATCHES) ) {
	return;
  }
  
  // Disable the default action of the event (don't open the URL of the target).
  event.preventDefault();
  
  if (event.target.id == "search_by_cert_button") {
	cleanup_display();
    populate_certificate_info(QUERY.certificate_number.value);
  }
  
  if (event.target.id == "search_by_name_button") {
    cleanup_display();
	search_by_name();
  }
  
  if (event.target.id.startsWith("display_certificate_")) {
    const certificate_number = event.target.id.replace("display_certificate_", "");
	populate_certificate_info(certificate_number);
  }
}

document.addEventListener("click", function() {click_handler(event);});


async function populate_certificate_info(certificate_number) {
  // Populate the HTML document with the certificate information retrieved from the Firebase database.
  // Args:
  //   certificate_number: A string denoting the certificate number of a Firebase document in the *certificates* collection.
  // Returns:
  //   None
  
  // Query the *certificates* collection
  console.log("Getting the certificate data from Firestore.");
  await CERTIFICATES_REF.where("certificate_number", "==", certificate_number)
    .get()
	.then(function(certificate_snapshot) {
	  console.log("Certificate snapshot:", certificate_snapshot);
	  certificate_snapshot.forEach(function(certificate) {
	    DISPLAY.certificate_number.innerHTML = certificate_number;
		DISPLAY.date_of_issue.innerHTML = certificate.get("date_of_issue").toDate().toLocaleString("default", {dateStyle: "long"});
		DISPLAY.grade.innerHTML = certificate.get("grade");
		DISPLAY.grade.href = "#" + certificate.get("grade").toLowerCase().replace(/ /g, "-");
		DISPLAY.status.innerHTML = certificate.get("status");
        
		// Get the student document
		certificate.get("student_ref").get()
		  .then(function(student) {
			console.log("Student snapshot:", student);
			DISPLAY.first_name.innerHTML = student.get("first_name");
			DISPLAY.last_name.innerHTML = student.get("last_name");
			DISPLAY.total_certificates.innerHTML = student.get("certificate_numbers").length;
		  })
		  .catch(err => console.error("Error getting student document", err));
        
		// Get the course document
		certificate.get("course_ref").get()
		  .then(function(course) {
			console.log("Course snapshot:", course);
			DISPLAY.course_name.innerHTML = course.get("name");
			DISPLAY.course_length.innerHTML = course.get("length");
			DISPLAY.curriculum.innerHTML = course.get("short_name");
			DISPLAY.curriculum.href = SITE_URL + "/curriculum/#" + course.get("short_name").replace(/ /g, "-");
			DISPLAY.achievability.innerHTML = course.get("grades_stats")[certificate.get("grade")] + "/" + course.get("grades_stats")["total"];
		  })
		  .catch(err => console.error("Error getting course document", err));

	  });
	})
	.catch(err => console.error("Error getting certificate document", err));
}


async function search_by_name() {
  // Query the *students* collection
  console.log("Getting the student data from Firestore.");
  await STUDENTS_REF.where("first_name", "==", QUERY.first_name.value).where("last_name", "==", QUERY.last_name.value)
    .get()
    .then(function(student_snapshot) {
	  console.log("Student snapshot:", student_snapshot);
      student_snapshot.forEach(function(student) {
        console.log("Student document snapshot:", student);
        console.log("Student data:", student.data());
        
        // Create a hyperlink to display each certificate.
        for (const certificate_number of student.get("certificate_numbers")) {
          // Build a hyperlink
          let cert_hyperlink = "<p>" + student.get("first_name") + " " + student.get("last_name") + ": <a href=\"\" id=\"display_certificate_" + certificate_number + "\">" + certificate_number + "</a></p>";
          // Add the hyperlink to the HTML
          LIST_OF_CERTIFICATES.innerHTML += cert_hyperlink
        }
      });
    })
	.catch(err => console.error("Error getting student documents:", err));
}


function cleanup_display() {
  // At a new search, clean up the previously displayed certificate information before displaying the new results.
   
  // For displaying the list of a student's certificate numbers
  LIST_OF_CERTIFICATES.innerHTML = "";
  
  // For displaying the retrieved certificate information
  for (const key in DISPLAY) {
    DISPLAY[key].innerHTML = "";
  }
}


function includes(test_string, target_array, match_type="starts_with") {
  // Checks whether any string in the *target_array* is a substring to *test_string*.
  // Example:  includes("welcome home!", ["234", "welcome", "abc"], "starts_with")  yields true.
  //
  // Args:
  //   test_string: The string to test. If a match, this string contains one of the strings in the target array.
  //   target_array: The target array. If a match, of the strings in this array is a substring of the test string.
  //   match_type: One of the three strings: "starts_with", "includes", "ends_with"
  // Returns:
  //   true if a partial match is found
  //   false if the test string is not a partial match to any of the strings in the target array.
  
  if (match_type == "starts_with") {
    for (target of target_array) {
      if (test_string.startsWith(target))
        return true;
    }
    // If you reach here, it means none of the strings in the array were a match.
    return false;
  } else if (match_type == "includes") {
      for (target of target_array) {
        if (test_string.includes(target))
          return true;
      }
	  // If you reach here, it means none of the strings in the array were a match.
	  return false;
  } else if (match_type == "ends_with") {
      for (target of target_array) {
        if (test_string.endsWith(target))
          return true;
      }
	  // If you reach here, it means none of the strings in the array were a match.
	  return false;
  }
}
