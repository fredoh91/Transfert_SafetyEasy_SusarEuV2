
/**
 * @typedef {Object} active_substance_grouping
 * @property {number} : id
 * @property {string} : active_substance_high_level
 * @property {string} : active_substance_low_level
 * @property {number} : inactif
 * @property {Date} : date_fichier
 * @property {string} : utilisateur_import
 * @property {Date} : created_at
 * @property {Date} : updated_at
 */
/**
 * @typedef {Object} susar_eu
 * @property {number} : master_id
 * @property {number} : caseid
 * @property {string} : specificcaseid
 * @property {number} : DLPVersion
 * @property {Date} : creationdate
 * @property {Date} : statusdate
 * @property {string} : worldwideuniquecaseidentificationnumber
 * @property {string} : iscaseserious
 * @property {string} : seriousnesscriteria
 * @property {Date} : receivedate
 * @property {Date} : receiptdate
 * @property {string} : patientsex
 * @property {number} : patientonsetage
 * @property {string} : patientonsetageunitlabel
 * @property {string} : patientagegroup
 * @property {string} : pays_survenue
 * @property {string} : narrativeincludeclinical
 * @property {string} : casesummarylanguage
 * @property {string} : casesummary
 */

/**
 * @typedef {Object} medicaments
 * @property {number} : master_id
 * @property {number} : caseid
 * @property {string} : specificcaseid
 * @property {number} : DLPVersion
 * @property {string} : productcharacterization
 * @property {string} : productname
 * @property {number} : NBBlock
 * @property {string} : substancename
 * @property {number} : NBBlock2
 */

/**
 * @typedef {Object} effets_indesirables
 * @property {number} : master_id
 * @property {number} : caseid
 * @property {string} : specificcaseid
 * @property {number} : DLPVersion
 * @property {Date} : reactionstartdate
 * @property {string} : reactionmeddrallt
 * @property {number} : codereactionmeddrallt
 * @property {string} : reactionmeddrapt
 * @property {number} : codereactionmeddrapt
 * @property {string} : reactionmeddrahlt
 * @property {number} : codereactionmeddrahlt
 * @property {string} : reactionmeddrahlgt
 * @property {number} : codereactionmeddrahlgt
 * @property {string} : soc
 * @property {number} : reactionmeddrasoc
 */

/**
 * @typedef {Object} medical_history
 * @property {number} : master_id
 * @property {string} : patientepisodenameasreported
 * @property {number} : code_LLT
 * @property {string} : lib_LLT
 * @property {number} : code_PT
 * @property {string} : lib_PT
 * @property {number} : patientepisodesoccode
 * @property {string} : patientepisodesocname
 * @property {string} : patientepisodenamemeddraversion
 * @property {string} : patientmedicalcontinue
 * @property {Date} : patientmedicalenddate
 * @property {Date} : patientmedicalstartdate
 * @property {string} : familyhistory
 * @property {string} : patientmedicalcomment
 */

/**
 * @typedef {Object} donnees_etude
 * @property {number} : master_id
 * @property {number} : caseid
 * @property {string} : specificcaseid
 * @property {number} : DLPVersion
 * @property {string} : studytitle
 * @property {string} : sponsorstudynumb
 * @property {string} : num_eudract
 * @property {string} : pays_etude
 */

/**
 * @typedef {Object} intervenant_substance_dmm
 * @property {number} : id
 * @property {string} : dmm
 * @property {string} : pole_long
 * @property {string} : pole_court
 * @property {string} : evaluateur
 * @property {string} : active_substance_high_level
 * @property {string} : type_sa_ms_mono
 * @property {boolean} : association_de_substances
 */
