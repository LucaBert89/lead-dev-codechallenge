import React, {useCallback, useState} from 'react'
import {FileRejection, useDropzone} from 'react-dropzone'
import {gql, useMutation} from "@apollo/client"
import emailjs from "emailjs-com"

const JobApplications = gql `
  mutation createJob($name: String!, $surname: String!, $email: String!, $phone: String!, $curriculum: String!) {
    createJobApplication(data: {name: $name, surname: $surname, email: $email, phone: $phone, curriculum: $curriculum}) {
      id
    }
  }
`;

export default function Form(props) {
    console.log(props);
    const [files, setFiles] = useState([]);
    const [inputs, setInputs] = useState({user_name:"", user_surname:"", user_email:"", user_phone:"",user_note:""});
    const onDrop = useCallback((acceptedFiles: File[],rejFiles: FileRejection[]) => {
        const mapFile = acceptedFiles.map(file => ({file, errors:[]}))
        setFiles(curr => [...curr, ...mapFile, ...rejFiles])
      }, [])
  
      
   const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, accept: "application/pdf", maxFiles:10, maxSize:1542880})
   const [mutateFunction] = useMutation(JobApplications);


    const handleChange = (e) =>{
        const name = e.target.name;
        const value = e.target.value;
        setInputs(values => ({...values, [name]: value}))
    }


   const uploadImage = async (e) => {
    const fileAdded = {};
       console.log(inputs.user_email    )
      const form = new FormData();
      for(let i = 0; i<files.length; i++) {
        form.set(`fileUpload`, files[i].file)

        try {
        const response = await fetch(`${process.env.GATSBY_GCMS_ENDPOINT}/upload`, {
            method: 'POST',
        
            body: form,
        })
        const blob = await response.blob();
        const blobtoText = await blob.text();
        const textJson = await JSON.parse(blobtoText);
        console.log(textJson)
       
        fileAdded[`curriculum${i}`]= textJson.url;
    
        } catch(err) {
            console.log(err);
        } 
    }
    const emailTemplate = {
        user_name: inputs.user_name,
        user_surname: inputs.user_surname,
        user_email: inputs.user_email,
        user_phone: inputs.user_phone,
        user_note: inputs.user_note,
        user_url: JSON.stringify(fileAdded)
    }
   
    await mutateFunction({ variables: {  name: inputs.user_name, surname: inputs.user_surname, email: inputs.user_email, phone: inputs.user_phone, curriculum: JSON.stringify(fileAdded)}})
    sendEmail(emailTemplate)
    }

    const sendEmail = async (e) => {
        const emailSend = await emailjs.send(process.env.GATSBY_SERVICE_ID, process.env.GATSBY_TEMPLATE_ID, e, process.env.GATSBY_MAILJS_ID);
        console.log(emailSend)
    }

    return (
        <div className="form-application__container">
            <div className="form-cv-column">
            <form className="form-application__input"
                onSubmit={e => {
                    e.preventDefault();
                    uploadImage(e)
                }}>
                    <label>Name</label>
                    <input type="text" name="user_name" onChange={handleChange} value={inputs.user_name} placeholder={props.formInput[8].name} />
                    <label>Surname</label>
                    <input type="text" name="user_surname"onChange={handleChange} value={inputs.user_surname} placeholder={props.formInput[8].surname} />
                    <label>Email</label>
                    <input type="email" name="user_email" onChange={handleChange} value={inputs.user_email} placeholder={props.formInput[8].email}/>
                    <label>Phone</label>
                    <input type="text" name="user_phone" onChange={handleChange} value={inputs.user_phone} placeholder={props.formInput[8].phone}/>
                    <label>note</label>
                    <textarea name="user_note" onChange={handleChange} value={inputs.user_note} placeholder={props.formInput[8].note}></textarea>
                    <div className="dropzone-container">
                        <p>Carica il tuo curriculum (obbligatorio file pdf max 1.5MB)</p>
                        <div className="dropzone" {...getRootProps()}>
                            <input {...getInputProps()} />
                    
                    
                            <p>Drag 'n' drop some files here, or click to select files</p>
                            
                            <em>(0 of 10)</em>
                        
                        </div>
                    </div>
                <button type="submit">Add Todo</button>
            </form>
           
            </div>
        </div>
    )
}
