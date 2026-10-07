ALTER TABLE transfers MODIFY COLUMN status ENUM('Pending','Approved','Rejected','Completed','Cancelled') DEFAULT 'Pending';
